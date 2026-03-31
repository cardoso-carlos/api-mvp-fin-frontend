const state = {
  loading: false,
  searchTimer: null,
  filters: {
    status: "todos",
  },
  sort: {
    key: "data",
    direction: "desc",
  },
  cache: {
    lancamentos: [],
  },
  selected: {
    lancamentos: null,
  },
  pag: {
    lancamentos: { page: 1, size: 6, items: [] },
  },
};

const $ = (id) => document.getElementById(id);

function on(id, eventName, handler) {
  const node = $(id);
  if (node) node.addEventListener(eventName, handler);
}


const el = {
  appScreen: $("app-screen"),
  sessionInfo: $("session-info"),
  appFeedback: $("app-feedback"),
  baseUrl: $("base-url"),
  lancamentosDashboard: $("lancamentos-dashboard"),
  metricSaldo: $("metric-saldo"),
  metricReceitas: $("metric-receitas"),
  metricDespesas: $("metric-despesas"),
  metricTotalCount: $("metric-total-count"),
  metricReceitasCount: $("metric-receitas-count"),
  metricDespesasCount: $("metric-despesas-count"),
  reportPrint: $("report-print"),
  reportTitle: $("report-title"),
  reportSubtitle: $("report-subtitle"),
  reportGeneratedAt: $("report-generated-at"),
  reportSummary: $("report-summary"),
  reportTableHead: $("report-table-head"),
  reportTableBody: $("report-table-body"),
  lanCards: $("lan-list-cards"),
  lanPrev: $("lan-prev"),
  lanNext: $("lan-next"),
  lanPageInfo: $("lan-page-info"),
  lanResultsInfo: $("lan-results-info"),
  lanStatusFilters: $("lan-status-filters"),
  lanSortButtons: document.querySelectorAll("[data-sort-key]"),
};

const fields = {
  lancamento: {
    id: $("lan-id"),
    tipo: $("lan-tipo_lancamento"),
    descricao: $("lan-descricao"),
    valor: $("lan-valor"),
    dataLancamento: $("lan-data-lanc"),
    dataPagamento: $("lan-data-pag"),
    situacao: $("lan-situacao"),
  },
  relatorio: {
    dataInicial: $("rep-data-inicial"),
    dataFinal: $("rep-data-final"),
    tipo: $("rep-tipo"),
    lancamentoId: $("rep-lanc-id"),
  },
  listaLancamentos: {
    dataInicial: $("lan-list-data-inicial"),
    dataFinal: $("lan-list-data-final"),
    busca: $("lan-search"),
  },
};

const STORAGE_KEYS = {
  apiBaseUrl: "api-mvp-fin-frontend:api-base-url",
};

function showFeedback(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle("error", isError);
  target.classList.toggle("loading", !isError && state.loading);
}

function clearFieldState(...nodes) {
  nodes.filter(Boolean).forEach((node) => node.classList.remove("input-error"));
}

function markFieldError(node) {
  if (node) node.classList.add("input-error");
}

function apiUrl(path) {
  return `${el.baseUrl.value.trim().replace(/\/$/, "")}${path}`;
}

function loadStoredBaseUrl() {
  const saved = window.localStorage.getItem(STORAGE_KEYS.apiBaseUrl);
  if (saved) el.baseUrl.value = saved;
}

function persistBaseUrl() {
  const value = el.baseUrl.value.trim();
  if (value) {
    window.localStorage.setItem(STORAGE_KEYS.apiBaseUrl, value);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
  }
}

function authHeaders() {
  return {};
}

async function apiFetch(path, method = "GET", body = null) {
  state.loading = true;
  showFeedback(el.appFeedback, "Carregando...");

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: body ? JSON.stringify(body) : null,
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`);
    }

    return data;
  } finally {
    state.loading = false;
  }
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function periodQuery(diId = "rep-data-inicial", dfId = "rep-data-final") {
  const di = $(diId).value;
  const df = $(dfId).value;
  return `?data_inicial=${encodeURIComponent(di)}&data_final=${encodeURIComponent(df)}`;
}

function getCurrentMonthRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10),
  };
}

function initializeDateFilters() {
  const { start, end } = getCurrentMonthRange();
  [fields.listaLancamentos.dataInicial, fields.relatorio.dataInicial].forEach((field) => {
    if (field) field.value = start;
  });
  [fields.listaLancamentos.dataFinal, fields.relatorio.dataFinal].forEach((field) => {
    if (field) field.value = end;
  });
}

function validatePeriodFields(startField, endField, label) {
  clearFieldState(startField, endField);

  if (!startField.value || !endField.value) {
    if (!startField.value) markFieldError(startField);
    if (!endField.value) markFieldError(endField);
    throw new Error(`Preencha o periodo de ${label}.`);
  }

  if (startField.value > endField.value) {
    markFieldError(startField);
    markFieldError(endField);
    throw new Error(`A data inicial de ${label} nao pode ser maior que a data final.`);
  }
}

function getLancamentoPayload() {
  const { tipo, descricao, valor, dataLancamento, dataPagamento, situacao } = fields.lancamento;
  clearFieldState(tipo, descricao, valor, dataLancamento, dataPagamento, situacao);

  const payload = {
    tipo: tipo.value.trim(),
    descricao: descricao.value.trim(),
    valor: Number(valor.value),
    data_lancamento: dataLancamento.value,
    data_pagamento: dataPagamento.value || null,
    situacao: situacao.value,
  };

  if (!payload.descricao) {
    markFieldError(descricao);
    throw new Error("Informe a descricao do lancamento.");
  }

  if (!Number.isFinite(payload.valor) || payload.valor <= 0) {
    markFieldError(valor);
    throw new Error("Informe um valor maior que zero.");
  }

  if (!payload.data_lancamento) {
    markFieldError(dataLancamento);
    throw new Error("Informe a data de lancamento.");
  }

  if (payload.data_pagamento && payload.data_pagamento < payload.data_lancamento) {
    markFieldError(dataLancamento);
    markFieldError(dataPagamento);
    throw new Error("A data de pagamento nao pode ser anterior a data de lancamento.");
  }

  return payload;
}

function normalizeCurrencyInput(value) {
  const sanitized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return sanitized;
}

function bindCurrencyInput() {
  const { valor } = fields.lancamento;
  if (!valor) return;

  valor.addEventListener("blur", () => {
    const normalized = normalizeCurrencyInput(valor.value);
    const numericValue = Number(normalized);

    if (!normalized) {
      valor.value = "";
      return;
    }

    if (Number.isFinite(numericValue)) {
      valor.value = numericValue.toFixed(2);
      clearFieldState(valor);
    }
  });
}

function normalizeLancamentosData(raw) {
  if (!Array.isArray(raw)) return [];
  if (!raw.length) return raw;

  if (Array.isArray(raw[0].lancamentos)) {
    const out = [];
    raw.forEach((group) => {
      group.lancamentos.forEach((item) => {
        out.push({ ...item });
      });
    });
    return out;
  }

  return raw;
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "pt-BR", { sensitivity: "base" });
}

function compareNumber(a, b) {
  return Number(a || 0) - Number(b || 0);
}

function compareDate(a, b) {
  return new Date(`${a || ""}T00:00:00`).getTime() - new Date(`${b || ""}T00:00:00`).getTime();
}

function sortLancamentos(items = []) {
  const { key, direction } = state.sort;
  const signal = direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    let result = 0;

    if (key === "id") result = compareNumber(a.id, b.id);
    if (key === "descricao") result = compareText(a.descricao, b.descricao);
    if (key === "tipo") result = compareText(a.tipo, b.tipo);
    if (key === "valor") result = compareNumber(a.valor, b.valor);
    if (key === "data") result = compareDate(a.data_lancamento, b.data_lancamento);
    if (key === "situacao") result = compareText(a.situacao, b.situacao);

    if (result === 0) {
      result = compareNumber(a.id, b.id);
    }

    return result * signal;
  });
}

function filterLancamentos(items = []) {
  const term = fields.listaLancamentos.busca?.value.trim().toLowerCase() || "";
  const status = state.filters.status;

  let filtered = items;

  if (status !== "todos") {
    filtered = filtered.filter((item) => String(item.situacao || "").toLowerCase() === status);
  }

  if (!term) return filtered;

  return filtered.filter((item) =>
    String(item.descricao || "").toLowerCase().includes(term),
  );
}

function updateLancamentosResultsInfo(filteredCount, totalCount) {
  if (!el.lanResultsInfo) return;

  if (!fields.listaLancamentos.busca?.value.trim()) {
    el.lanResultsInfo.textContent = `Mostrando ${totalCount} lancamento(s) do periodo.`;
    return;
  }

  el.lanResultsInfo.textContent = `Mostrando ${filteredCount} de ${totalCount} lancamento(s) para a busca atual.`;
}

function updateSortButtonsState() {
  if (!el.lanSortButtons?.length) return;

  el.lanSortButtons.forEach((button) => {
    const isActive = button.dataset.sortKey === state.sort.key;
    button.classList.toggle("active", isActive);
    button.dataset.sortDirection = isActive ? state.sort.direction : "";

    const label = button.dataset.sortLabel || button.textContent.trim();
    button.setAttribute(
      "aria-label",
      isActive ? `${label}, ordenacao ${state.sort.direction === "asc" ? "crescente" : "decrescente"}`
        : `${label}, ordenar`,
    );
  });
}

function applyLancamentosView(keepSelection = false) {
  const sortedItems = sortLancamentos(state.cache.lancamentos);
  state.pag.lancamentos.items = filterLancamentos(sortedItems);
  if (!keepSelection) state.pag.lancamentos.page = 1;
  updateDashboardMetrics(sortedItems);
  updateLancamentosResultsInfo(state.pag.lancamentos.items.length, sortedItems.length);
  updateSortButtonsState();

  renderPaginatedTable({
    key: "lancamentos",
    container: el.lanCards,
    pageInfoEl: el.lanPageInfo,
    rowClass: "lancamento-grid",
    rowMapper: (item) => [
      { label: "ID", value: String(item.id) },
      { label: "Tipo", value: String(item.tipo) },
      { label: "Descricao", value: item.descricao },
      { label: "Valor", value: formatCurrency(item.valor) },
      { label: "Data", value: item.data_lancamento || "-" },
      { label: "Situacao", html: `<span class="status-chip ${item.situacao}">${item.situacao}</span>` },
    ],
    onSelect: populateLancamentoForm,
  });

  if (state.selected.lancamentos) {
    const selected = state.pag.lancamentos.items.find((item) => Number(item.id) === Number(state.selected.lancamentos.id));
    selected ? populateLancamentoForm(selected) : resetLancamentoForm();
  }
}

function updateActionButtons(prefix, hasSelection) {
  $(`${prefix}-create`).disabled = hasSelection;
  $(`${prefix}-update`).disabled = !hasSelection;
  $(`${prefix}-delete`).disabled = !hasSelection;
  $(`${prefix}-selection-status`).textContent = hasSelection ? "Modo edicao" : "Modo inclusao";
}

function resetLancamentoForm() {
  state.selected.lancamentos = null;
  fields.lancamento.id.value = "";
  fields.lancamento.tipo.value = "Despesa";
  fields.lancamento.descricao.value = "";
  fields.lancamento.valor.value = "";
  fields.lancamento.dataLancamento.value = "";
  fields.lancamento.dataPagamento.value = "";
  fields.lancamento.situacao.value = "pendente";
  clearFieldState(
    fields.lancamento.tipo,
    fields.lancamento.descricao,
    fields.lancamento.valor,
    fields.lancamento.dataLancamento,
    fields.lancamento.dataPagamento,
    fields.lancamento.situacao,
  );
  updateActionButtons("lan", false);
  highlightSelectedRow(el.lanCards, null);
}

function populateLancamentoForm(item) {
  state.selected.lancamentos = item;
  fields.lancamento.id.value = item.id;
  fields.lancamento.tipo.value = item.tipo;
  fields.lancamento.descricao.value = item.descricao;
  fields.lancamento.valor.value = item.valor;
  fields.lancamento.dataLancamento.value = item.data_lancamento || "";
  fields.lancamento.dataPagamento.value = item.data_pagamento || "";
  fields.lancamento.situacao.value = item.situacao;
  updateActionButtons("lan", true);
  highlightSelectedRow(el.lanCards, item.id);
}

function highlightSelectedRow(container, id) {
  container.querySelectorAll(".table-row.clickable").forEach((row) => {
    row.classList.toggle("selected", id !== null && Number(row.dataset.id) === Number(id));
  });
}

function buildTableRow(className, cells, itemId, onClick) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = `table-row clickable ${className}`;
  row.dataset.id = itemId;

  cells.forEach((cell) => {
    const span = document.createElement("span");
    span.dataset.label = cell.label;
    if (cell.html) {
      span.innerHTML = cell.html;
    } else {
      span.textContent = cell.value;
    }
    row.appendChild(span);
  });

  row.addEventListener("click", onClick);
  return row;
}

function renderPaginatedTable({ key, container, pageInfoEl, rowClass, rowMapper, onSelect }) {
  const pag = state.pag[key];
  const totalPages = Math.max(1, Math.ceil(pag.items.length / pag.size));

  if (pag.page > totalPages) {
    pag.page = totalPages;
  }

  const start = (pag.page - 1) * pag.size;
  const items = pag.items.slice(start, start + pag.size);
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = `table-row ${rowClass}`;
    empty.innerHTML = '<span data-label="Status" class="cell-muted">Nenhum registro encontrado.</span>';
    container.appendChild(empty);
  } else {
    items.forEach((item) => {
      container.appendChild(buildTableRow(rowClass, rowMapper(item), item.id, () => onSelect(item)));
    });
  }

  pageInfoEl.textContent = `Pagina ${pag.page} de ${totalPages} (${pag.items.length} itens)`;
}

function renderEmptyReport() {
  el.reportTitle.textContent = "Relatorio nao gerado";
  el.reportSubtitle.textContent = "Use os filtros ao lado para gerar o relatorio.";
  el.reportGeneratedAt.textContent = "-";
  el.reportSummary.innerHTML = "";
  el.reportTableHead.innerHTML = "";
  el.reportTableBody.innerHTML = "<tr><td>Nenhum relatorio gerado.</td></tr>";
}

function renderReportTable({ title, subtitle, columns, rows, summary = [] }) {
  el.reportTitle.textContent = title;
  el.reportSubtitle.textContent = subtitle;
  el.reportGeneratedAt.textContent = `Gerado em ${formatDateTime()}`;

  el.reportSummary.innerHTML = "";
  summary.forEach((item) => {
    const box = document.createElement("div");
    box.className = "report-summary-item";
    box.innerHTML = `<strong>${item.label}</strong><span>${item.value}</span>`;
    el.reportSummary.appendChild(box);
  });

  el.reportTableHead.innerHTML = "";
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    el.reportTableHead.appendChild(th);
  });

  el.reportTableBody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(1, columns.length);
    td.textContent = "Nenhum registro encontrado para os filtros informados.";
    tr.appendChild(td);
    el.reportTableBody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    el.reportTableBody.appendChild(tr);
  });
}

function setActiveView(viewName, label) {
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  if (el.lancamentosDashboard) {
    el.lancamentosDashboard.classList.toggle("hidden", viewName !== "lancamentos");
  }

  document.title = `${label} | MVP Lancamento Financeiro`;
  showFeedback(el.appFeedback, "Pronto.");
}

function bindMenu() {
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.querySelector("strong") ? btn.querySelector("strong").textContent : btn.textContent;
      setActiveView(btn.dataset.view, title);
    });
  });
}

async function listLancamentos(keepSelection = false) {
  validatePeriodFields(fields.listaLancamentos.dataInicial, fields.listaLancamentos.dataFinal, "listagem");
  const body = await apiFetch(`/api/lancamentos${periodQuery("lan-list-data-inicial", "lan-list-data-final")}`);
  state.cache.lancamentos = normalizeLancamentosData(body.data || []);
  applyLancamentosView(keepSelection);
}

async function crudLancamentos(action) {
  const id = fields.lancamento.id.value;
  if (action === "create") return apiFetch("/api/lancamentos", "POST", getLancamentoPayload());
  if (!id) throw new Error("Selecione um lancamento para continuar.");
  if (action === "update") return apiFetch(`/api/lancamentos/${id}`, "PUT", getLancamentoPayload());
  if (action === "delete") return apiFetch(`/api/lancamentos/${id}`, "DELETE");
}

async function relatorio(action) {
  const tipo = fields.relatorio.tipo.value;
  const lancamentoId = fields.relatorio.lancamentoId.value;
  const periodo = `${fields.relatorio.dataInicial.value} ate ${fields.relatorio.dataFinal.value}`;

  if (action === "lanc-list") {
    validatePeriodFields(fields.relatorio.dataInicial, fields.relatorio.dataFinal, "relatorio");
    const body = await apiFetch(`/api/lancamentos${periodQuery()}`);
    const items = normalizeLancamentosData(body.data || []);
    return renderReportTable({
      title: "Lancamentos por Periodo",
      subtitle: `Consulta consolidada do periodo ${periodo}.`,
      columns: ["ID", "Tipo", "Descricao", "Valor", "Data", "Situacao"],
      rows: items.map((item) => [
        String(item.id), item.tipo, item.descricao, formatCurrency(item.valor), item.data_lancamento || "-", item.situacao,
      ]),
      summary: [
        { label: "Periodo", value: periodo },
        { label: "Quantidade", value: String(items.length) },
        { label: "Valor Total", value: formatCurrency(items.reduce((acc, item) => acc + Number(item.valor || 0), 0)) },
      ],
    });
  }

  if (action === "saldos") {
    validatePeriodFields(fields.relatorio.dataInicial, fields.relatorio.dataFinal, "relatorio");
    const body = await apiFetch(`/api/lancamentos/saldos${periodQuery()}`);
    const items = Array.isArray(body.data) ? body.data : [body.data];
    return renderReportTable({
      title: "Resumo de Saldos",
      subtitle: `Saldo consolidado para o periodo ${periodo}.`,
      columns: ["Receitas", "Despesas", "Saldo"],
      rows: items.map((item) => [formatCurrency(item.receitas), formatCurrency(item.despesas), formatCurrency(item.saldo)]),
      summary: [
        { label: "Receitas", value: formatCurrency(items.reduce((acc, item) => acc + Number(item.receitas || 0), 0)) },
        { label: "Despesas", value: formatCurrency(items.reduce((acc, item) => acc + Number(item.despesas || 0), 0)) },
        { label: "Saldo", value: formatCurrency(items.reduce((acc, item) => acc + Number(item.saldo || 0), 0)) },
      ],
    });
  }

 
  if (action === "tipo") {
    validatePeriodFields(fields.relatorio.dataInicial, fields.relatorio.dataFinal, "relatorio");
    const body = await apiFetch(`/api/lancamentos/tipo/${tipo}${periodQuery()}`);
    const items = normalizeLancamentosData(body.data || []);
    return renderReportTable({
      title: `Lancamentos do Tipo ${tipo}`,
      subtitle: `Consulta por tipo no periodo ${periodo}.`,
      columns: ["ID", "Tipo", "Descricao", "Valor", "Data", "Situacao"],
      rows: items.map((item) => [String(item.id), item.tipo, item.descricao, formatCurrency(item.valor), item.data_lancamento || "-", item.situacao]),
      summary: [
        { label: "Tipo", value: tipo },
        { label: "Quantidade", value: String(items.length) },
        { label: "Total", value: formatCurrency(items.reduce((acc, item) => acc + Number(item.valor || 0), 0)) },
      ],
    });
  }

  if (action === "id") {
    if (!lancamentoId) throw new Error("Informe o ID do lancamento.");
    const body = await apiFetch(`/api/lancamentos/${lancamentoId}`);
    const item = body.data;
    return renderReportTable({
      title: `Lancamento ${item.id}`,
      subtitle: "Consulta detalhada por identificador.",
      columns: ["ID", "Tipo", "Descricao", "Valor", "Data", "Pagamento", "Situacao"],
      rows: [[String(item.id), item.tipo, item.descricao, formatCurrency(item.valor), item.data_lancamento || "-", item.data_pagamento || "-", item.situacao]],
      summary: [
        { label: "ID", value: String(item.id) },
        { label: "Tipo", value: item.tipo},
        { label: "Valor", value: formatCurrency(item.valor) },
      ],
    });
  }
}

function updateDashboardMetrics(items = []) {
  const receitas = items
    .filter((item) => String(item.tipo).toLowerCase() === "receita")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const receitasCount = items
    .filter((item) => String(item.tipo).toLowerCase() === "receita")
    .length;
  const despesas = items
    .filter((item) => String(item.tipo).toLowerCase() === "despesa")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const despesasCount = items
    .filter((item) => String(item.tipo).toLowerCase() === "despesa")
    .length;
  const saldo = receitas - despesas;

  el.metricReceitas.textContent = formatCurrency(receitas);
  el.metricDespesas.textContent = formatCurrency(despesas);
  el.metricSaldo.textContent = formatCurrency(saldo);
  if (el.metricTotalCount) el.metricTotalCount.textContent = `${items.length} lancamento(s) no periodo`;
  if (el.metricReceitasCount) el.metricReceitasCount.textContent = `${receitasCount} receita(s)`;
  if (el.metricDespesasCount) el.metricDespesasCount.textContent = `${despesasCount} despesa(s)`;
}

function bindPagers() {
  if (el.lanPrev) {
    el.lanPrev.addEventListener("click", () => {
      state.pag.lancamentos.page = Math.max(1, state.pag.lancamentos.page - 1);
      listLancamentos(true);
    });
  }

  if (el.lanNext) {
    el.lanNext.addEventListener("click", () => {
      const max = Math.max(1, Math.ceil(state.pag.lancamentos.items.length / state.pag.lancamentos.size));
      state.pag.lancamentos.page = Math.min(max, state.pag.lancamentos.page + 1);
      listLancamentos(true);
    });
  }
}

function bindCrudButtons() {
  const handle = async (fn, successMessage, afterSuccess) => {
    try {
      const result = await fn();
      if (result === false) return;
      if (afterSuccess) await afterSuccess();
      showFeedback(el.appFeedback, successMessage);
    } catch (err) {
      showFeedback(el.appFeedback, err.message, true);
    }
  };

  on("lan-create", "click", () => handle(() => crudLancamentos("create"), "Lancamento criado com sucesso.", async () => {
    resetLancamentoForm();
    await listLancamentos();
  }));
  on("lan-update", "click", () => handle(() => crudLancamentos("update"), "Lancamento atualizado com sucesso.", async () => {
    await listLancamentos(true);
  }));
  on("lan-delete", "click", () => handle(async () => {
    const descricao = state.selected.lancamentos?.descricao || "este lancamento";
    if (!window.confirm(`Deseja realmente excluir ${descricao}?`)) return false;
    return crudLancamentos("delete");
  }, "Lancamento excluido com sucesso.", async () => {
    resetLancamentoForm();
    await listLancamentos();
  }));
  on("lan-clear", "click", resetLancamentoForm);
  on("lan-list", "click", () => handle(() => listLancamentos(), "Lancamentos atualizados."));

  on("rep-lanc-list", "click", () => handle(() => relatorio("lanc-list"), "Relatorio carregado."));
  on("rep-tipo-btn", "click", () => handle(() => relatorio("tipo"), "Relatorio por tipo carregado."));
  on("rep-lanc-id-btn", "click", () => handle(() => relatorio("id"), "Lancamento encontrado."));
  on("rep-saldos", "click", () => handle(() => relatorio("saldos"), "Saldos carregados."));
}

function bindSearch() {
  on("lan-search", "input", () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(() => {
      applyLancamentosView();
    }, 180);
  });
}

function bindStatusFilters() {
  if (!el.lanStatusFilters) return;

  el.lanStatusFilters.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.status = button.dataset.status || "todos";
      el.lanStatusFilters.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip === button);
      });
      applyLancamentosView();
    });
  });
}

function bindSortButtons() {
  if (!el.lanSortButtons?.length) return;

  el.lanSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sortKey;
      if (!nextKey) return;

      if (state.sort.key === nextKey) {
        state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
      } else {
        state.sort.key = nextKey;
        state.sort.direction = nextKey === "descricao" || nextKey === "tipo" || nextKey === "situacao" ? "asc" : "desc";
      }

      applyLancamentosView();
    });
  });
}

if (el.reportPrint) {
  el.reportPrint.addEventListener("click", () => window.print());
}

if (el.baseUrl) {
  el.baseUrl.addEventListener("change", persistBaseUrl);
  el.baseUrl.addEventListener("blur", persistBaseUrl);
}

loadStoredBaseUrl();
bindMenu();
bindPagers();
bindCrudButtons();
bindSearch();
bindStatusFilters();
bindSortButtons();
bindCurrencyInput();
initializeDateFilters();
setActiveView("lancamentos", "Lancamentos");
resetLancamentoForm();
renderEmptyReport();
listLancamentos().then(() => {
  el.sessionInfo.textContent = "Conectado ao backend";
}).catch((err) => {
  el.sessionInfo.textContent = "Backend indisponivel";
  showFeedback(el.appFeedback, err.message, true);
});

window.addEventListener("resize", () => {
  if (!el.appScreen.hidden) updateDashboardMetrics(state.pag.lancamentos.items);
});
