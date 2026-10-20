# CNC Insight — Sistema de apoio à manutenção industrial (protótipo didático)

Projeto de referência para a Situação de Aprendizagem Integrada: WebAR (A-Frame + MindAR), API Flask, mensageria MQTT (Eclipse Mosquitto), simulador Python e Docker Compose.

> **Importante:** todos os valores são fictícios. O projeto **não** estabelece limites de segurança, procedimentos oficiais nem recomendações de manutenção para equipamentos reais.

## O que está incluído e o que ainda precisa ser feito

- Incluído: API com identificação e telemetria, subscriber MQTT, publisher simulador, Compose com 3 serviços, interface WebAR com 4 hotspots e tratamento de indisponibilidade, documentação e matriz de testes.
- **Pendente:** compilar o arquivo `frontend/assets/targets/cnc.mind` a partir da imagem target, testar o tracking e posicionamento dos hotspots em um celular, publicar frontend em HTTPS e informar a URL pública, validar matriz com resultados reais. O arquivo `.mind` é gerado por uma ferramenta externa e não foi fabricado como placeholder inválido.
- A imagem `frontend/assets/images/cnc-target.svg` é um **exemplo didático**; a equipe pode substituí-la por uma foto real autorizada do Torno CNC e ajustar as posições dos quatro hotspots em `frontend/index.html`.

## Arquitetura

```text
Imagem target → MindAR/A-Frame (navegador móvel)
                         │ toque no hotspot 04
                         ▼
                    GET HTTP/JSON
                         │
                         ▼
                  Flask API :5000
                         ▲
                     MQTT subscriber
                         ▲
               Mosquitto broker :1883
                         ▲
                    MQTT publisher
                         ▲
                   Simulador Python
```

## Pré-requisitos

- Docker Desktop (com Linux containers) e `docker compose`.
- Navegador com suporte à câmera e WebAR.
- Para acesso à câmera no celular: **HTTPS** (origem segura). Em desktop, `localhost` pode ser aceito como origem segura para testes locais.

## 1. Iniciar backend, broker e simulador

Na raiz do projeto:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f backend simulator
```

A API fica disponível em:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/equipamentos/CNC-01`
- `http://localhost:5000/api/equipamentos/CNC-01/telemetria`

Espere alguns segundos e atualize o endpoint de telemetria. A temperatura e a vibração devem mudar a cada ~2 segundos (se broker, simulador e subscriber estiverem conectados).

Se a porta 1883 estiver ocupada, crie um `.env` na raiz com `MQTT_HOST_PORT=1884` (copie de `.env.example`). A comunicação **entre containers** continua usando `mosquitto:1883`.

**Atenção:** a porta HTTP 5000 está publicada na rede local para permitir o acesso por outro dispositivo. Use apenas em rede confiável; o protótipo não possui autenticação. Não exponha a API nem o broker à internet.

## 2. Testar MQTT manualmente

Em um terminal:

```bash
docker compose exec mosquitto mosquitto_sub -h localhost -t 'industria/#' -v
```

Em outro terminal, publique um novo valor:

```bash
docker compose exec mosquitto mosquitto_pub -h localhost -t industria/CNC-01/temperatura -m 47.2
```

Depois consulte `/api/equipamentos/CNC-01/telemetria`. Como o simulador publica a cada 2 segundos, o valor manual pode ser sobrescrito rapidamente. Para demonstrar com calma:

```bash
docker compose stop simulator
# publique o valor e consulte a API
docker compose start simulator
```

## 3. Preparar o target de RA (obrigatório)

1. Escolha a imagem target. Para uma primeira tentativa, use `frontend/assets/images/cnc-target.svg`; para melhor rastreamento, prefira uma imagem com detalhes e textura variados, como uma fotografia real do equipamento com boa iluminação.
2. Se usar o SVG, exporte-o para PNG/JPG (ex.: pelo navegador ou editor de imagem).
3. Abra o **compilador oficial de image targets do MindAR**: https://hiukim.github.io/mind-ar-js-doc/tools/compile/ .
4. Carregue a imagem, compile e baixe o `.mind` gerado.
5. Renomeie para **`cnc.mind`** e salve em `frontend/assets/targets/cnc.mind`.
6. Imprima ou mostre a **mesma imagem** em outra tela. O navegador deve reconhecer esse target.

O arquivo `cnc.mind` é específico da imagem escolhida. Se trocar a imagem, gere um novo `.mind`.

## 4. Executar frontend

Na pasta `frontend`:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080` no computador. Para a câmera funcionar em um **celular**, hospede o frontend por **HTTPS** (por exemplo, num serviço de hospedagem estática com TLS), ou use um túnel HTTPS apropriado para testes. **A URL pública não pode ser inventada: precisa ser publicada pela equipe.**

A interface busca a API por padrão em `${location.protocol}//${location.hostname}:5000`. Isso funciona para testes HTTP na mesma rede, mas **não** para uma página hospedada em HTTPS consultando uma API HTTP (bloqueio de mixed content). Para publicação, configure um reverse proxy HTTPS para a API e informe a URL segura usando o parâmetro de query `?api=https://seu-host-api`, ou adapte `API_BASE` em `frontend/js/app.js`.

> O Flask está com CORS liberado para fins didáticos. Em produção, restrinja `CORS_ORIGINS` à origem do frontend e utilize HTTPS/autenticação.

### Hotspots

- **01 — Identificação:** identificação e função geral do equipamento.
- **02 — Componentes:** cabeçote/placa, torre, painel, proteção.
- **03 — Manutenção:** orientações didáticas e cuidados gerais.
- **04 — Monitoramento:** `fetch()` para a API Flask, exibindo status, temperatura, vibração e horário.

Os hotspots são elementos HTML posicionados na tela pela projeção de quatro âncoras 3D do MindAR. Assim acompanham o target quando a câmera se move. Ajuste as coordenadas `position` em `frontend/index.html` para corresponder às regiões da sua imagem.

O botão **Consultar telemetria** na lateral permite testar a API sem a câmera, mas **não substitui** a demonstração do hotspot RA exigida pelo enunciado.

## 5. Demonstração de falha

1. Com frontend aberto e serviços ativos, consulte o hotspot 04.
2. Execute `docker compose stop backend`.
3. Consulte novamente: a interface deve mostrar mensagem de indisponibilidade, sem travar o rastreamento.
4. Execute `docker compose start backend` e consulte outra vez.

## 6. Encerrar

```bash
docker compose down
```

## Portas e nomes internos

| Serviço | Porta dentro do Compose | Porta publicada no host |
|---|---|---|
| Mosquitto | `mosquitto:1883` | `127.0.0.1:1883` (ou `MQTT_HOST_PORT`) |
| Flask | `backend:5000` | `0.0.0.0:5000` (ou `API_HOST_PORT`) |
| Simulador | Conecta em `mosquitto:1883` | Nenhuma |

`127.0.0.1` **dentro do container** aponta para o próprio container, não para o computador nem para o broker. Por isso usamos o nome de serviço `mosquitto` na rede interna.

## Por que Docker e Compose?

O Docker encapsula as dependências e o ambiente Python em imagens reproduzíveis. O Compose descreve os três serviços, rede interna, variáveis e mapeamento de portas, reduzindo diferenças entre computadores. O código do Flask permanece separado do broker e do simulador, permitindo reiniciar cada parte independentemente.

## Modelos de nuvem

| Cenário do enunciado | Modelo | Responsabilidades |
|---|---|---|
| Empresa contrata VM Linux e instala Docker, Flask e MQTT | **IaaS** | Provedor gerencia hardware/virtualização; empresa administra SO da VM, aplicações, containers, atualizações e dados. |
| Equipe entrega aplicação para plataforma que administra execução | **PaaS** | Provedor administra infraestrutura e runtime; equipe mantém código, configuração, dados e regras de negócio. |
| Técnico apenas acessa solução pronta pelo navegador | **SaaS** | Provedor do software opera e mantém a aplicação; usuário utiliza funcionalidades e gerencia seu acesso/dados conforme contrato. |

## Testes e entregáveis

Preencha `docs/testes.md` com resultados **reais**. O diagrama da arquitetura está em `docs/arquitetura.md` (Mermaid); exporte-o para PNG se o professor exigir imagem. Publicar o frontend e entregar a URL, target `.mind` e comprovação da demonstração são atividades que dependem do ambiente/equipe.
