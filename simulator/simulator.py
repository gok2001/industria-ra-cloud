import paho.mqtt.client as mqtt
import time
import random

broker = "127.0.0.1"
port = 1883

equipamento_id = "CNC-01"

topico_temperatura = f"industria/{equipamento_id}/temperatura"
topico_vibracao = f"industria/{equipamento_id}/vibracao"
topico_status = f"industria/{equipamento_id}/status"

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

client.connect(broker, port, 60)

while True:
    temperatura = round(random.uniform(30, 50), 2)
    vibracao = round(random.uniform(1, 3), 2)
    status = random.choice(["operando", "desligado"])

    client.publish(topico_temperatura, temperatura)
    client.publish(topico_vibracao, vibracao)
    client.publish(topico_status, status)

    print(f"temperatura: {temperatura} | vibracao: {vibracao} | status: {status}")

    time.sleep(2)
