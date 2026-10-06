from flask import Flask, jsonify, render_template

app = Flask(__name__)


@app.route("/api/equipamentos/<id>")
def equipamentos(id):
    return jsonify({
        "id": id,
        "tipo": "Torno CNC",
        "setor": "Usinagem",
        "status": "operacional"
    })


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
