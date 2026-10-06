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
    return jsonify({
        "temperatura": 41.8,
        "vibracao": 2.3,
        "status": "operando",
        "atualizacao": "10:42:16"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
