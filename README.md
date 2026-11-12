# MilScale - Escala Service

Esse é o microsserviço das escalas de serviço e das trocas. Cada escala é um serviço de 24 horas, das 08h00 às 08h00 do dia seguinte, em um posto como cabo da guarda ou sentinela. O sargenteante monta a escala como rascunho, publica, e depois disso os militares só podem pedir troca.

As regras que o serviço garante são as que o pessoal da sargenteação usa hoje na planilha: o mesmo militar não pode ser escalado duas vezes no mesmo dia, escala publicada não pode mais ser editada nem apagada, troca só pode ser pedida com pelo menos 24 horas de antecedência do início do serviço e o substituto não pode já estar escalado naquele dia.

Quando uma escala é publicada ou uma troca é aprovada, o serviço grava o evento no banco e manda uma mensagem pra fila `escala-eventos` do Azure Service Bus. Quem consome essa fila é a Azure Function, que gera a notificação pros militares. Os eventos são o EscalaPublicada e o TrocaAprovada, o contrato deles está em `/asyncapi.json` e também na seção Eventos do Swagger, e o histórico pode ser consultado em `GET /eventos`.

O banco é o Azure SQL Database, com as tabelas de escalas, trocas e eventos, que são criadas quando o serviço sobe. O código segue Clean Architecture com Vertical Slice: o domínio tem a Escala, a Troca, as regras e as interfaces (repositórios, publicador de eventos e relógio), a aplicação tem um caso de uso por pasta (criar, listar, buscar, editar, remover e publicar escala, pedir, listar e aprovar troca, listar eventos), a infraestrutura tem os repositórios do SQL e o publicador do Service Bus, e a API tem as rotas, o Swagger e o AsyncAPI. Os testes unitários cobrem principalmente a regra das 24h e o conflito de datas, e os de arquitetura garantem que o Service Bus e o SQL só aparecem na infraestrutura.

Foi feito em Node.js 22 com TypeScript, Express 5, mssql e o SDK do Service Bus, com Swagger UI, AsyncAPI, Jest, Supertest e Docker.

Pra rodar localmente precisa da connection string do SQL e do Service Bus no `.env`:

```bash
npm install
cp .env.example .env
npm run dev
npm test
```

A imagem foi publicada no Docker Hub assim:

```bash
docker build -t enzowlima/milscale-escala-service:v1 .
docker push enzowlima/milscale-escala-service:v1
```

Na nuvem ele roda no Azure Container Apps. O Swagger está em https://ca-milscale-escala.ashyforest-fcfffbba.eastus2.azurecontainerapps.io/swagger, o contrato dos eventos em https://ca-milscale-escala.ashyforest-fcfffbba.eastus2.azurecontainerapps.io/asyncapi.json e a imagem em https://hub.docker.com/r/enzowlima/milscale-escala-service. Os outros repositórios são o frontend (https://github.com/enzoojapa/milscale-frontend), o BFF (https://github.com/enzoojapa/milscale-bff), o serviço de efetivo (https://github.com/enzoojapa/milscale-efetivo-service) e a Function (https://github.com/enzoojapa/milscale-function).

Trabalho feito por Enzo Watanabe de Lima, João Guilherme Salomão, João Guilherme Cordeiro e Rafael Zeni Simião, para a disciplina de Arquitetura e Soluções Cloud da PUCPR (2026/2).
