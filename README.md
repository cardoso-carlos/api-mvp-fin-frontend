# API MVP Fin Frontend

Frontend do projeto de lancamento financeiro pessoal desenvolvido com HTML, CSS e JavaScript puro.

Esta interface permite cadastrar, listar, atualizar, excluir e consultar lancamentos financeiros consumindo a API do backend. O projeto nao utiliza frameworks como React, Angular ou Vue, sendo executado como uma aplicacao estatica simples.

Importante: o frontend nao usa ambiente virtual `venv`. O `venv` e utilizado apenas no backend Python.

## Funcionalidades

- tela inicial em lancamentos
- cadastro e edicao de lancamentos
- exclusao com confirmacao
- listagem por periodo
- busca por descricao
- filtros rapidos por situacao
- ordenacao por colunas
- paginacao
- cards de resumo financeiro
- geracao de relatorios
- impressao de relatorios

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript puro
- Node.js apenas para executar o script `npm start`
- Python 3 para servir os arquivos estaticos localmente

## Estrutura do Projeto

- `index.html`: estrutura da interface
- `styles.css`: estilos visuais e responsividade
- `app.js`: logica da aplicacao
- `favicon.svg`: icone da aba do navegador
- `package.json`: scripts para inicializacao local

## Instalação e Configuração Local

## 1. Pre-requisitos
Antes de executar o frontend, tenha instalado:

- Node.js e npm
- Python 3

## 2. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd api-mvp-fin-frontend
```

## 3. Configurar URL da API backend
No frontend, a URL base da API deve apontar para:
- `http://localhost:5002`


### 4. Acessar a pasta do frontend

Linux/macOS:

```bash
cd api-mvp-fin-frontend
```

Windows PowerShell ou CMD:

```powershell
cd api-mvp-fin-frontend
```

### 5. Verificar o arquivo `package.json`

O projeto ja possui os scripts:

- `npm start`
- `npm run dev`

Como este frontend nao usa dependencias externas de build, normalmente nao e necessario executar `npm install`.

Tambem nao e necessario criar ou ativar `venv` no frontend.

## Como Executar

Execute um dos comandos abaixo:

```bash
npm start
```

ou

```bash
npm run dev
```

Isso iniciara um servidor local simples em:

```text
http://127.0.0.1:5500
```

ou

```text
http://localhost:5500
```

## Configuracao da API

Com o frontend aberto no navegador, o campo `API Base URL` deve apontar para o backend:

```text
http://127.0.0.1:5002
```


### Terminal: frontend

Linux/macOS, Windows PowerShell ou CMD:

```bash
cd api-mvp-fin-frontend
npm start
```

Observacao:

- o frontend nao precisa de `venv`
- o comando `npm start` apenas sobe um servidor estatico local com Python 3

Depois abra no navegador:

```text
http://localhost:5500
```

## Comportamento da Aplicacao

Ao abrir a pagina:

- o menu inicial sera `Lançamentos`
- os filtros de data sao preenchidos com o mes atual
- a lista de lancamentos e carregada da API
- os cards de saldo, receitas e despesas sao atualizados

Na tela de lancamentos voce pode:

- cadastrar novos registros
- selecionar uma linha para editar
- excluir com confirmacao
- filtrar por descricao
- filtrar por situacao
- ordenar clicando no cabecalho

Na tela de relatorios voce pode:

- listar lancamentos por periodo
- consultar por tipo
- buscar por ID
- visualizar saldos consolidados
- imprimir o relatorio

## Scripts Disponiveis

### `npm start`

Inicia um servidor HTTP local usando Python:

```bash
python3 -m http.server 5500
```

### `npm run dev`

Executa o mesmo servidor local, mantendo a opcao de um nome mais comum para desenvolvimento.

## Observacoes

- o frontend e uma aplicacao estatica, sem processo de build
- nao ha framework SPA
- algumas requisicoes do navegador, como `favicon` ou `.well-known`, podem aparecer no terminal com `404` e isso nao afeta a aplicacao
- para refletir alteracoes no navegador, em geral basta recarregar a pagina

## Comando Resumido

```bash
cd api-mvp-fin-frontend
npm start
```
