from flask import Flask, jsonify, render_template


app = Flask(__name__)

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

    equipamento = dados_telemetria[id]

    return jsonify(equipamento)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
