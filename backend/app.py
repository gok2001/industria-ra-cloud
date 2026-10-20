from flask import Flask, jsonify
import paho.mqtt.client as mqtt
from datetime import datetime
from threading import Lock


app = Flask(__name__)

BROKER = "127.0.0.1"
PORTA_MQTT = 1883
TOPICO_MQTT = "industria/#"

telemetria_lock = Lock()

dados_equipamentos = {
    "CNC-01": {
        "id": "CNC-01",
        "tipo": "Torno CNC",
        "setor": "Usinagem",
        "status": "operacional"
    },
    "CNC-02": {
        "id": "CNC-02",
        "tipo": "Torno CNC",
        "setor": "Usinagem",
        "status": "inoperante"
    }
}

dados_telemetria = {
    "CNC-01": {
        "temperatura": 41.8,
        "vibracao": 2.3,
        "status": "operando",
        "atualizacao": "10:42:16"
    },
    "CNC-02": {
        "temperatura": 32.6,
        "vibracao": 1.4,
        "status": "desligado",
        "atualizacao": "13:53:51"
    }
}


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Conectado ao broker MQTT!")

        client.subscribe(TOPICO_MQTT)

        print(f"Inscrito no tópico: {TOPICO_MQTT}")
    else:
        print(f"Falha na conexão MQTT: {reason_code}")


def on_message(client, userdata, msg):
    partes = msg.topic.split("/")

    if len(partes) != 3 or partes[0] != "industria":
        return

    equipamento_id = partes[1]
    indicador = partes[2]

    if indicador not in ("temperatura", "vibracao", "status"):
        return

    try:
        valor = msg.payload.decode("utf-8")

        if indicador in ("temperatura", "vibracao"):
            valor = float(valor)

    except (UnicodeDecodeError, ValueError):
        print(f"Mensagem inválida: {msg.topic}")
        return

    with telemetria_lock:
        if equipamento_id not in dados_telemetria:
            print(f"Equipamento desconhecido: {equipamento_id}")
            return

        dados_telemetria[equipamento_id][indicador] = valor

        dados_telemetria[equipamento_id]["atualizacao"] = (
            datetime.now().strftime("%H:%M:%S")
        )

    print(f"MQTT recebido: {equipamento_id} | {indicador}: {valor}")


@app.route("/api/equipamentos/<id>")
def equipamentos(id):
    if id not in dados_equipamentos:
        return jsonify({
            "erro": "equipamento não existente"
        }), 404

    equipamento = dados_equipamentos[id]

    return jsonify(equipamento)


@app.route("/api/equipamentos/<id>/telemetria")
def telemetria(id):
    if id not in dados_telemetria:
        return jsonify({
            "erro": "telemetria não existente"
        }), 404

    telemetria_equipamento = dados_telemetria[id]

    return jsonify(telemetria_equipamento)


def iniciar_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER, PORTA_MQTT, 60)
    client.loop_start()

    return client


if __name__ == "__main__":
    cliente_mqtt = iniciar_mqtt()

    try:
        app.run(
            host="0.0.0.0",
            port=5000,
            debug=True,
            use_reloader=False
        )
    finally:
        cliente_mqtt.loop_stop()
        cliente_mqtt.disconnect()