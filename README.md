# MilScale - Escala Service

Microsserviço de escalas de serviço e trocas do MilScale. Cada escala é um serviço de 24 horas (08h00 às 08h00 do dia seguinte) em um posto.
Ao publicar uma escala ou aprovar uma troca, o serviço emite um evento no **Azure Service Bus**, consumido pela Azure Function que notifica os militares.

## Regras de negócio

- Um militar não pode ser escalado duas vezes no mesmo dia.
- Escala publicada não pode ser editada nem removida, só trocada.
- Troca só pode ser pedida com **no mínimo 24 horas** de antecedência do início do serviço.
- O substituto não pode já estar escalado no mesmo dia.

## Arquitetura

```
Usuário -> Microfrontend (React) -> API Gateway (AWS) -> BFF (Node.js)
                                                         |-> Efetivo Service -> MongoDB Atlas
                                                         |-> Escala Service  -> Azure SQL
                                                         |                   -> Azure Service Bus -> Function (notificar-escala)
                                                         |-> Azure Function (calcular-ciclo)
```

**Clean Architecture** + **Vertical Slice**:

```
src/
  domain/            Escala, Troca, regras e portas (repositórios, EventPublisher, Clock)
  application/       create-escala, list-escalas, get-escala, update-escala, delete-escala,
                     publish-escala, request-troca, list-trocas, approve-troca, list-eventos
  infrastructure/    repositórios Azure SQL (mssql), publisher do Service Bus, log de eventos
  api/               rotas por feature, Swagger (OpenAPI) e contrato de eventos (AsyncAPI)
tests/
  unit/              regras de domínio (24h, conflito de datas) e API
  architecture/      dependências entre camadas, slices e uso do Service Bus só na infraestrutura
```

Banco: **Azure SQL Database** (tabelas `escalas`, `trocas` e `eventos`, criadas na inicialização).

## Eventos

| Evento | Quando | Fila |
|---|---|---|
| EscalaPublicada | POST /escalas/{id}/publicar | escala-eventos |
| TrocaAprovada | POST /trocas/{id}/aprovar | escala-eventos |

Contrato em `/asyncapi.json` e nos schemas da seção Eventos do Swagger. O histórico fica em `GET /eventos`.

## Tecnologias

Node.js 22, TypeScript, Express 5, mssql (Azure SQL), @azure/service-bus, Swagger UI, AsyncAPI, Jest, Supertest, Docker.

## Como rodar localmente

```bash
npm install
cp .env.example .env   # SQL_CONNECTION_STRING e SERVICEBUS_CONNECTION_STRING
npm run dev            # http://localhost:3002/swagger
npm test
```

```bash
docker build -t enzoojapa/milscale-escala-service:v1 .
docker run -p 3002:3002 -e SQL_CONNECTION_STRING="..." -e SERVICEBUS_CONNECTION_STRING="..." enzoojapa/milscale-escala-service:v1
```

## Links

- Swagger: _LINK_SWAGGER_
- Docker Hub: _LINK_DOCKER_

## Projetos do sistema

| Componente | Repositório |
|---|---|
| Microfrontend (React) | [milscale-frontend](https://github.com/enzoojapa/milscale-frontend) |
| BFF (Node.js) | [milscale-bff](https://github.com/enzoojapa/milscale-bff) |
| Microsserviço de efetivo (MongoDB) | [milscale-efetivo-service](https://github.com/enzoojapa/milscale-efetivo-service) |
| Microsserviço de escalas (Azure SQL) | [milscale-escala-service](https://github.com/enzoojapa/milscale-escala-service) |
| Azure Function | [milscale-function](https://github.com/enzoojapa/milscale-function) |

## Alunos

- Enzo Watanabe de Lima
- João Guilherme Salomão
- João Guilherme Cordeiro
- Rafael Zeni Simião

PUCPR - Engenharia de Software - Arquitetura e Soluções Cloud (2026/2)
