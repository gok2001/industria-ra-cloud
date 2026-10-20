# Manual Interativo Industrial — WebAR + MQTT + Flask

Protótipo didático com dois equipamentos: **Robo-01 (braço robótico)** e **Robo-02 (robô móvel)**. Dados de telemetria são simulados e não constituem limites reais de segurança.

## Estrutura

- `frontend/`: MindAR + A-Frame, seleção dos dois robôs, cinco hotspots por alvo (quatro técnicos e um de monitoramento).
- `backend/`: API Flask e subscriber MQTT.
- `simulator/`: publicador MQTT reutilizado por duas instâncias, uma por equipamento.
- `mqtt/`: configuração do Mosquitto.
- `compose.yaml`: Mosquitto, backend, simulator e simulator-movel.
- `docs/`: arquitetura e matriz de testes.

## Executar

Instale Docker Desktop com engine Linux, e na raiz do projeto execute:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f backend simulator simulator-movel
```

A API responde em:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/equipamentos/Robo-01`
- `http://localhost:5000/api/equipamentos/Robo-01/telemetria`
- `http://localhost:5000/api/equipamentos/Robo-02/telemetria`

Se a porta 1883 estiver ocupada, copie `.env.example` para `.env` (usa porta externa 1884). Entre os containers, a porta MQTT permanece `mosquitto:1883`.

## Frontend

```bash
cd frontend
python -m http.server 8080
```

Abra `http://localhost:8080`, escolha o robô e aponte a câmera para a imagem correspondente em `frontend/assets/images/`. O arquivo `frontend/assets/targets/equipamentos.mind` já está no projeto; é necessário confirmar que ele foi compilado com as duas imagens, **na ordem** braço robótico = índice 0, robô móvel = índice 1. Se a ordem não corresponder, recompile o arquivo multi-target ou ajuste os índices em `frontend/index.html`.

A API é descoberta pelo hostname da página e porta 5000. Para um frontend publicado em HTTPS, a API também precisa ser acessível por HTTPS; configure a URL com `?api=https://seu-servidor-api` (URL real, não fictícia). O acesso à câmera no celular requer HTTPS/origem segura. A API Flask local não fornece HTTPS por conta própria.

## MQTT

O serviço `simulator` publica em `industria/Robo-01/{temperatura,vibracao,status}`; `simulator-movel` publica nos tópicos equivalentes de `Robo-02`. O backend assina `industria/+/+` e atualiza o dicionário correspondente.

```bash
docker compose exec mosquitto mosquitto_sub -h localhost -t 'industria/#' -v
```

Para testar manualmente sem o simulador sobrescrever o valor imediatamente:

```bash
docker compose stop simulator
docker compose exec mosquitto mosquitto_pub -h localhost -t industria/Robo-01/temperatura -m 47.2
docker compose start simulator
```

## Teste de indisponibilidade

```bash
docker compose stop backend
# consultar hotspot de monitoramento: deve exibir mensagem de erro
docker compose start backend
```

A API responde erro HTTP 404 para equipamentos desconhecidos. O frontend preserva o rastreamento de RA quando a consulta falha.

## Entrega e limitações

Execute e registre os testes em `docs/testes.md`. A aplicação não foi validada neste ambiente com Docker ou câmera física. É necessário validar reconhecimento dos targets, posicionamento dos hotspots, HTTPS no celular e publicação da URL final.

**Docker** empacota as dependências de cada serviço; **Compose** configura rede e execução integrada. No cenário de uma VM gerenciada pela equipe, a infraestrutura é próxima de **IaaS**; numa plataforma que gerencia runtime, **PaaS**; no uso da aplicação pronta pelo técnico, **SaaS** sob a perspectiva do usuário.
