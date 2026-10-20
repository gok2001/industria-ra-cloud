import os
import logging
from datetime import datetime
from threading import Lock

import paho.mqtt.client as mqtt
from flask import Flask, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': os.getenv('CORS_ORIGINS', '*')}})
BROKER = os.getenv('MQTT_BROKER', '127.0.0.1')
MQTT_PORT = int(os.getenv('MQTT_PORT', '1883'))
lock = Lock()

dados_equipamentos = {
    'CNC-01': {'id': 'CNC-01', 'tipo': 'Torno CNC', 'setor': 'Usinagem', 'status': 'operacional'},
    'CNC-02': {'id': 'CNC-02', 'tipo': 'Torno CNC', 'setor': 'Usinagem', 'status': 'inoperante'},
}
dados_telemetria = {
    'CNC-01': {'temperatura': None, 'vibracao': None, 'status': 'aguardando dados', 'atualizacao': None},
    'CNC-02': {'temperatura': None, 'vibracao': None, 'status': 'aguardando dados', 'atualizacao': None},
}


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        client.subscribe('industria/+/+')
        logger.info('MQTT conectado e inscrito em industria/+/+')

    else:
        logger.warning('MQTT recusou conexão: %s', reason_code)


def on_message(client, userdata, msg):
    partes = msg.topic.split('/')

    if len(partes) != 3 or partes[0] != 'industria':
        return

    _, equipamento, indicador = partes

    if indicador not in ('temperatura', 'vibracao', 'status'):
        return

    try:
        valor = msg.payload.decode('utf-8')

        if indicador != 'status':
            valor = float(valor)

            if not -1000 <= valor <= 1000:
                raise ValueError('valor fora do intervalo de validação técnica')

        elif len(valor) > 80:
            raise ValueError('status muito longo')

    except (UnicodeDecodeError, ValueError) as exc:
        logger.warning('Mensagem ignorada (%s): %s', msg.topic, exc)

        return

    with lock:
        if equipamento not in dados_telemetria:
            logger.warning('Equipamento não cadastrado: %s', equipamento)

            return

        dados_telemetria[equipamento][indicador] = valor
        dados_telemetria[equipamento]['atualizacao'] = datetime.now().astimezone().isoformat(timespec='seconds')

    logger.info('Atualizado %s/%s = %s', equipamento, indicador, valor)


@app.get('/api/health')
def health():
    return jsonify({'servico': 'api', 'status': 'ok'})


@app.get('/api/equipamentos/<id>')
def equipamentos(id):
    equipamento = dados_equipamentos.get(id)

    if equipamento is None:
        return jsonify({'erro': 'equipamento não existente'}), 404

    return jsonify(equipamento)


@app.get('/api/equipamentos/<id>/telemetria')
def telemetria(id):
    with lock:
        equipamento = dados_telemetria.get(id)

        if equipamento is None:
            return jsonify({'erro': 'telemetria não existente'}), 404

        copia = equipamento.copy()

    return jsonify(copia)


def iniciar_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect_async(BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()

    return client


if __name__ == '__main__':
    cliente = iniciar_mqtt()

    try:
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

    finally:
        cliente.disconnect()
        cliente.loop_stop()
