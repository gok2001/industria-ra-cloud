import os
import random
import time
import logging
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
BROKER = os.getenv('MQTT_BROKER', '127.0.0.1')
PORTA = int(os.getenv('MQTT_PORT', '1883'))
EQUIPAMENTO = os.getenv('EQUIPAMENTO_ID', 'Robo-01')
INTERVALO = float(os.getenv('INTERVALO_SEGUNDOS', '2'))
conectado = False


def on_connect(client, userdata, flags, reason_code, properties):
    global conectado
    conectado = reason_code == 0
    logging.info('Conexão MQTT: %s', reason_code)


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    global conectado
    conectado = False
    logging.warning('Desconectado do MQTT: %s', reason_code)


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.connect_async(BROKER, PORTA, keepalive=60)
    client.loop_start()

    try:
        while True:
            if conectado:
                leituras = {
                    'temperatura': round(random.uniform(30, 50), 2),
                    'vibracao': round(random.uniform(1, 3), 2),
                    'status': random.choice(['operando', 'desligado']),
                }

                for indicador, valor in leituras.items():
                    topico = f'industria/{EQUIPAMENTO}/{indicador}'
                    client.publish(topico, str(valor), qos=1)

                logging.info('%s: %s', EQUIPAMENTO, leituras)

            else:
                logging.info('Aguardando conexão com broker...')

            time.sleep(INTERVALO)

    except KeyboardInterrupt:
        logging.info('Simulador interrompido')

    finally:
        client.disconnect()
        client.loop_stop()


if __name__ == '__main__':
    main()
