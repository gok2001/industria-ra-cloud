# Arquitetura

```mermaid
flowchart TD
  SIM1[Simulador Robo-01] -->|MQTT| M[Mosquitto]
  SIM2[Simulador Robo-02] -->|MQTT| M
  M -->|Subscribe industria/+/+| API[Flask]
  WEB[WebAR MindAR / A-Frame] -->|HTTP GET /api/equipamentos/id/telemetria| API
```

As leituras são simuladas. O frontend utiliza a imagem target para identificar o robô, mostra hotspots técnicos estáticos e consulta o Flask apenas no hotspot de monitoramento. O backend guarda os valores mais recentes em memória; reiniciar o processo descarta as últimas leituras até chegarem novas mensagens.
