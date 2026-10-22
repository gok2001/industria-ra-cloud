# Manual Interativo Industrial — WebAR + MQTT + Flask

Protótipo didático de realidade aumentada (WebAR) voltado ao monitoramento e à apresentação interativa de equipamentos industriais.

O projeto contempla dois equipamentos:

- **Robo-01:** braço robótico industrial.
- **Robo-02:** robô móvel industrial.

A aplicação permite visualizar informações técnicas por meio de hotspots interativos e consultar dados de telemetria disponibilizados por uma API Flask, integrada ao protocolo MQTT.

**Aviso:** os dados de telemetria são simulados e não representam medições reais nem limites de segurança operacional.

## Tecnologias utilizadas

- **HTML, CSS e JavaScript:** desenvolvimento da interface web.
- **MindAR e A-Frame:** reconhecimento de imagens e experiência de realidade aumentada.
- **Python e Flask:** desenvolvimento da API REST.
- **MQTT e Eclipse Mosquitto:** comunicação e transmissão dos dados de telemetria.
- **Docker e Docker Compose:** conteinerização e orquestração dos serviços.
- **GitHub Pages:** hospedagem estática do frontend.

## Estrutura do projeto

- `frontend/`: interface WebAR com MindAR e A-Frame, seleção dos equipamentos e cinco hotspots por alvo, sendo quatro informativos e um de monitoramento.
- `backend/`: API Flask responsável por disponibilizar as informações dos equipamentos e receber mensagens MQTT.
- `simulator/`: publicador MQTT reutilizado por duas instâncias, uma para cada equipamento.
- `mqtt/`: configuração do broker Eclipse Mosquitto.
- `compose.yaml`: definição dos serviços Mosquitto, backend, simulator e simulator-movel.
- `docs/`: documentação de arquitetura e matriz de testes.

## Funcionalidades

O protótipo contempla:

- Seleção entre dois equipamentos industriais.
- Reconhecimento de imagens utilizando realidade aumentada.
- Exibição de hotspots interativos associados aos equipamentos.
- Apresentação de informações técnicas sobre os componentes.
- Consulta de telemetria pelo botão **Info**.
- Simulação de temperatura, vibração e status operacional.
- Comunicação entre simuladores e backend por MQTT.
- Disponibilização dos dados por endpoints REST.
- Tratamento de falhas de comunicação com a API.

A consulta de telemetria requer que o backend esteja acessível ao navegador.

## Execução do projeto

### Pré-requisitos

Para executar a aplicação completa localmente, são necessários:

- Docker com suporte ao Docker Compose.
- Python 3.
- Navegador compatível com os recursos de câmera e realidade aumentada.
- Câmera disponível e permissão de acesso concedida ao navegador.

### 1. Iniciar os serviços Docker

Na raiz do projeto, execute:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Para acompanhar os logs:

```bash
docker compose logs -f backend simulator simulator-movel
```

Os serviços incluem o broker MQTT, a API Flask e os dois simuladores de telemetria.

Se a porta `1883` estiver ocupada, copie `.env.example` para `.env`, utilizando a configuração de porta externa `1884`.

A comunicação MQTT entre os containers permanece utilizando `mosquitto:1883`.

### 2. Verificar a API

Com os containers em execução, acesse:

`http://localhost:5000/api/health`

A resposta esperada é:

```json
{
  "servico": "api",
  "status": "ok"
}
```

Outros endpoints disponíveis:

| Endpoint | Descrição |
|---|---|
| `/api/health` | Verifica a disponibilidade da API. |
| `/api/equipamentos/Robo-01` | Retorna as informações cadastrais do braço robótico. |
| `/api/equipamentos/Robo-01/telemetria` | Retorna a telemetria do braço robótico. |
| `/api/equipamentos/Robo-02/telemetria` | Retorna a telemetria do robô móvel. |

Todos os endpoints utilizam como endereço-base `http://localhost:5000`.

A API retorna HTTP `404` para equipamentos não cadastrados.

### 3. Configurar o frontend

No arquivo `frontend/js/app.js`, configure o endereço da API:

```javascript
const API_BASE = "http://localhost:5000";
```

Essa configuração permite que o frontend executado localmente consulte a API Flask disponibilizada pelo Docker no mesmo computador.

### 4. Iniciar o servidor HTTP do frontend

A partir da raiz do projeto, execute:

```bash
cd frontend
python -m http.server 8080
```

Abra no navegador:

`http://localhost:8080`

O uso de um servidor HTTP local é recomendado em vez de abrir diretamente o arquivo HTML pelo sistema de arquivos.

### 5. Testar a realidade aumentada

Com o frontend aberto:

1. Selecione o braço robótico ou o robô móvel.
2. Permita o acesso à câmera.
3. Aponte a câmera para a imagem correspondente ao equipamento.
4. Aguarde o reconhecimento do alvo.
5. Interaja com os hotspots para visualizar informações técnicas.
6. Clique no botão **Info** para consultar os dados de telemetria.

A integração entre o frontend executado localmente e a API Flask no Docker foi testada com sucesso, incluindo a consulta pelo botão **Info**.

Os valores apresentados são fornecidos pelo backend e atualizados a partir das mensagens MQTT recebidas.

Caso ainda não existam mensagens para determinado indicador, o campo poderá aparecer como indisponível.

## Demonstração online — GitHub Pages

O frontend está publicado em:

**https://gok2001.github.io/industria-ra-cloud/**

Essa versão permite acessar a interface e demonstrar os recursos de realidade aumentada, desde que o navegador e o dispositivo sejam compatíveis.

### Limitação da integração online

Na configuração atual, o botão **Info** não consegue consultar a API local pelo GitHub Pages.

Isso ocorre por dois motivos:

1. O GitHub Pages utiliza HTTPS, enquanto a API Flask local é disponibilizada por HTTP. O navegador bloqueia esse tipo de requisição por segurança (*Mixed Content*).
2. O backend está sendo executado localmente no notebook e não possui um endereço público HTTPS configurado.

Portanto, a demonstração online não oferece a integração completa de telemetria.

**Para utilizar todas as funcionalidades, execute o frontend e o backend localmente**, seguindo as instruções da seção anterior.

Uma futura implantação completa pela internet exigiria disponibilizar a API por HTTPS, com configurações adequadas de segurança.

## Configuração dos alvos de realidade aumentada

As imagens utilizadas para reconhecimento estão disponíveis em:

`frontend/assets/images/`

O arquivo compilado de reconhecimento está localizado em:

`frontend/assets/targets/equipamentos.mind`

O arquivo deve conter as imagens dos dois equipamentos na seguinte ordem:

| Equipamento | Índice |
|---|---|
| Braço robótico — Robo-01 | 0 |
| Robô móvel — Robo-02 | 1 |

Caso a ordem não corresponda à configuração do frontend, será necessário recompilar o arquivo multi-target ou ajustar os índices em `frontend/index.html`.

O reconhecimento e o posicionamento dos hotspots podem variar conforme a câmera, iluminação, distância e dispositivo utilizado.

## Comunicação MQTT

O projeto utiliza o Eclipse Mosquitto como broker MQTT.

Os simuladores publicam informações nos tópicos:

**Robo-01**

- `industria/Robo-01/temperatura`
- `industria/Robo-01/vibracao`
- `industria/Robo-01/status`

**Robo-02**

- `industria/Robo-02/temperatura`
- `industria/Robo-02/vibracao`
- `industria/Robo-02/status`

O backend Flask assina:

`industria/+/+`

Ao receber mensagens válidas, atualiza os dados de telemetria correspondentes ao equipamento.

### Monitorar mensagens MQTT

Para acompanhar as mensagens publicadas, execute:

```bash
docker compose exec mosquitto mosquitto_sub -h localhost -t 'industria/#' -v
```

### Publicar dados manualmente

Para testar a publicação manual sem que o simulador sobrescreva imediatamente o valor:

```bash
docker compose stop simulator
docker compose exec mosquitto mosquitto_pub -h localhost -t industria/Robo-01/temperatura -m 47.2
docker compose start simulator
```

O valor publicado será recebido pelo backend caso a comunicação MQTT esteja funcionando corretamente.

## Testes e validação

A documentação dos testes está disponível em:

`docs/testes.md`

### Teste de indisponibilidade da API

Para simular uma falha na comunicação, interrompa temporariamente o backend:

```bash
docker compose stop backend
```

Com o frontend em execução, consulte o hotspot de monitoramento.

O comportamento esperado é a exibição de uma mensagem de erro, sem interromper o funcionamento do rastreamento de realidade aumentada.

Após o teste, reinicie o backend:

```bash
docker compose start backend
```

### Validações adicionais

Além da integração local já testada, recomenda-se verificar:

- Reconhecimento dos dois alvos em diferentes condições de iluminação.
- Posicionamento e visibilidade dos hotspots.
- Funcionamento da câmera em diferentes navegadores.
- Atualização dos indicadores a partir das mensagens MQTT.
- Tratamento de indisponibilidade da API.
- Comportamento da interface em dispositivos móveis.

Esses testes devem ser registrados conforme forem realizados.

## Encerramento dos serviços

Para interromper o servidor HTTP do frontend, pressione `Ctrl+C` no terminal em que ele está sendo executado.

Para encerrar os containers, execute na raiz do projeto:

```bash
docker compose down
```

## Entrega e limitações

O projeto foi desenvolvido como um protótipo didático, com foco na integração entre realidade aumentada, comunicação MQTT, API REST e conteinerização.

A comunicação entre o frontend local e a API Flask no Docker foi testada com sucesso.

Entretanto, a validação completa da aplicação em diferentes dispositivos, câmeras e condições de uso ainda deve ser realizada.

A versão do GitHub Pages funciona como demonstração do frontend, sem acesso à API local de telemetria na configuração atual.

Os dados apresentados são simulados e não devem ser utilizados para decisões reais de operação, manutenção ou segurança industrial.

### Conceitos de infraestrutura e computação em nuvem

O projeto também permite demonstrar diferentes conceitos de infraestrutura:

- **Docker:** empacota as aplicações e suas dependências em containers.
- **Docker Compose:** define e coordena os serviços, suas redes e configurações.
- **IaaS (Infrastructure as a Service):** cenário em que a aplicação é executada em uma máquina virtual ou infraestrutura gerenciada pela equipe.
- **PaaS (Platform as a Service):** cenário em que uma plataforma gerencia parte da infraestrutura e do ambiente de execução.
- **SaaS (Software as a Service):** perspectiva em que o usuário final acessa uma aplicação pronta como serviço, caso ela seja disponibilizada dessa forma.

Esses modelos são apresentados como possibilidades de implantação e utilização, não como serviços de nuvem necessariamente implementados no protótipo atual.