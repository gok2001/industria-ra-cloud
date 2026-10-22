document.addEventListener("DOMContentLoaded", () => {
    const parametros = new URLSearchParams(window.location.search);
    const API_BASE = (parametros.get("api") || `http://${window.location.hostname}:5000`).replace(/\/$/, "");
    const EQUIPMENT_IDS = { braco: "Robo-01", movel: "Robo-02" };

    const scene = document.querySelector("#ar-scene");
    const cameraElement = document.querySelector("#ar-camera");
    const selector = document.querySelector("#equipment-selector");
    const equipmentButtons = document.querySelectorAll(".equipment-button");

    const targets = {
        braco: document.querySelector("#target-braco"),
        movel: document.querySelector("#target-movel")
    };

    const status = document.querySelector("#status");
    const badge = document.querySelector("#badge");

    const panel = document.querySelector("#info-panel");
    const panelTitle = document.querySelector("#info-title");
    const panelText = document.querySelector("#info-text");
    const panelDetail = document.querySelector("#info-detail");
    const closeButton = document.querySelector("#close-panel");

    const hotspots = Array.from(
        document.querySelectorAll(".hotspot")
    );

    let selectedEquipment = null;
    let activeTarget = null;
    let tracking = false;

    // Informações apresentadas pelos pontos interativos.
    const information = {
        braco: {
            base: {
                title: "Base do robô industrial",
                text: "A base sustenta o robô e mantém sua estrutura posicionada durante a operação.",
                detail: "A estabilidade é importante para o funcionamento adequado do equipamento."
            },
            braco: {
                title: "Braço robótico",
                text: "O braço realiza os movimentos principais e posiciona o conjunto mecânico nos pontos de trabalho.",
                detail: "Os movimentos dependem do modelo e da aplicação do robô."
            },
            punho: {
                title: "Punho do robô",
                text: "O punho fica na extremidade do braço e orienta a ferramenta utilizada pelo robô.",
                detail: "Sua configuração depende do modelo do equipamento."
            },
            garra: {
                title: "Garra do robô",
                text: "A garra segura, movimenta ou manipula objetos durante determinadas operações.",
                detail: "O tipo de garra depende da atividade realizada."
            },
            monitoramento: {
                title: "Monitoramento industrial",
                text: "Consulte os dados atuais do equipamento.",
                detail: "Aguardando consulta à API."
            }
        },

        movel: {
            base: {
                title: "Chassi do robô móvel",
                text: "O chassi sustenta os componentes do robô móvel e serve como estrutura para os demais sistemas.",
                detail: "A estrutura deve suportar as condições de operação e a carga transportada."
            },
            braco: {
                title: "Sistema de movimentação",
                text: "O sistema de movimentação permite que o robô se desloque pelo ambiente industrial.",
                detail: "A configuração pode utilizar rodas, motores e sistemas de controle."
            },
            punho: {
                title: "Sensores do robô móvel",
                text: "Os sensores ajudam o robô a identificar obstáculos e perceber características do ambiente.",
                detail: "Os sensores disponíveis variam conforme o modelo."
            },
            garra: {
                title: "Área de carga",
                text: "A área de carga pode ser utilizada para transportar materiais ou componentes entre setores.",
                detail: "Respeite sempre os limites de carga definidos pelo fabricante."
            },
            monitoramento: {
                title: "Monitoramento do robô móvel",
                text: "Consulte os dados atuais do equipamento.",
                detail: "Aguardando consulta à API."
            }
        }
    };

    // Configuração dos hotspots para cada alvo.
    // As coordenadas são iniciais e podem precisar de ajustes visuais.
    const equipmentConfig = {
        braco: {
            label: "Braço Robótico Industrial",
            target: targets.braco,
            hotspots: [
                { topic: "base", x: -0.25, y: -0.05, z: 0.03, label: "1" },
                { topic: "braco", x: 0.035, y: 0.28, z: 0.03, label: "2" },
                { topic: "punho", x: 0.15, y: 0.36, z: 0.03, label: "3" },
                { topic: "garra", x: 0.11, y: 0.28, z: 0.03, label: "4" },
                { topic: "monitoramento", x: 0.00, y: 0.10, z: 0.03, label: "Info" }
            ]
        },

        movel: {
            label: "Robô Móvel Industrial",
            target: targets.movel,
            hotspots: [
                { topic: "base", x: 0.00, y: -0.05, z: 0.03, label: "1" },
                { topic: "braco", x: -0.20, y: 0.00, z: 0.03, label: "2" },
                { topic: "punho", x: 0.20, y: 0.10, z: 0.03, label: "3" },
                { topic: "garra", x: 0.00, y: 0.20, z: 0.03, label: "4" },
                { topic: "monitoramento", x: 0.00, y: 0.00, z: 0.03, label: "Info" }
            ]
        }
    };

    function hideInformation() {
        panel.classList.add("hidden");
    }

    function showInformation(topicName) {
        const selected = information[selectedEquipment]?.[topicName];

        if (!selected) {
            return;
        }

        panelTitle.textContent = selected.title;
        panelText.textContent = selected.text;
        panelDetail.textContent = selected.detail;
        panel.classList.remove("hidden");
    }

    
    async function consultarTelemetria() {
        const equipamentoSelecionado = selectedEquipment;

        const equipmentName =
            equipamentoSelecionado === "movel"
                ? "Robô móvel industrial"
                : "Robô industrial";

        panelTitle.textContent = `Monitoramento — ${equipmentName}`;
        panelText.textContent = "Consultando dados do equipamento...";
        panelDetail.textContent = "Aguardando resposta da API.";
        panel.classList.remove("hidden");

        const id = EQUIPMENT_IDS[equipamentoSelecionado];

        if (!id) {
            panelText.textContent = "Selecione um equipamento primeiro.";
            panelDetail.textContent = "";
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const url =
                `${API_BASE}/api/equipamentos/${encodeURIComponent(id)}/telemetria`;

            console.log("Consultando API:", url);

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const dados = await response.json();

            if (selectedEquipment !== equipamentoSelecionado) {
                return;
            }

            panelText.textContent =
                `Temperatura: ${dados.temperatura ?? "Indisponível"} | ` +
                `Vibração: ${dados.vibracao ?? "Indisponível"}`;

            panelDetail.textContent =
                `Status: ${dados.status ?? "Indisponível"} | ` +
                `Atualização: ${dados.atualizacao ?? "Aguardando dados"}`;

        } catch (error) {
            console.error("Erro ao consultar telemetria:", error);

            if (selectedEquipment !== equipamentoSelecionado) {
                return;
            }

            panelText.textContent =
                "Não foi possível consultar os dados do equipamento.";

            if (error.name === "AbortError") {
                panelDetail.textContent =
                    "A API demorou mais de 8 segundos para responder.";
            } else {
                panelDetail.textContent =
                    `Erro: ${error.message}. Verifique a conexão com a API.`;
            }

        } finally {
            clearTimeout(timeout);
        }
    }


    function configureHotspots(equipmentKey) {
        const config = equipmentConfig[equipmentKey];

        hotspots.forEach((button, index) => {
            const point = config.hotspots[index];

            button.dataset.topic = point.topic;
            button.dataset.x = point.x;
            button.dataset.y = point.y;
            button.dataset.z = point.z;
            button.textContent = point.label;

            button.setAttribute(
                "aria-label",
                information[equipmentKey][point.topic].title
            );

            button.classList.remove("visible");
            button.style.visibility = "hidden";
        });
    }

    function selectEquipment(equipmentKey) {
        if (!equipmentConfig[equipmentKey]) {
            return;
        }

        selectedEquipment = equipmentKey;
        activeTarget = equipmentConfig[equipmentKey].target;
        tracking = false;

        configureHotspots(equipmentKey);
        hideInformation();

        selector.classList.add("hidden");

        status.textContent =
            `Aponte a câmera para: ${equipmentConfig[equipmentKey].label}`;

        badge.textContent = "PROCURANDO ALVO";
    }

    equipmentButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectEquipment(button.dataset.equipment);
        });
    });

    hotspots.forEach((button) => {
        button.addEventListener("pointerup", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!tracking) {
                return;
            }

            const topicName = button.dataset.topic;

            if (topicName === "monitoramento") {
                consultarTelemetria();
            } else {
                showInformation(topicName);
            }
        });
    });

    closeButton.addEventListener("click", hideInformation);

    scene.addEventListener("arReady", () => {
        status.textContent =
            "Câmera pronta. Selecione um equipamento.";

        badge.textContent = "CÂMERA PRONTA";
    });

    scene.addEventListener("arError", () => {
        status.textContent =
            "Não foi possível iniciar a câmera. Verifique a permissão de acesso.";

        badge.textContent = "ERRO";
    });

    function handleTargetFound(equipmentKey) {
        if (equipmentKey !== selectedEquipment) {
            return;
        }

        activeTarget = equipmentConfig[equipmentKey].target;
        tracking = true;

        status.textContent =
            "Equipamento reconhecido. Toque em um ponto interativo.";

        badge.textContent = "● RA ATIVA";

        hotspots.forEach((button) => {
            button.classList.add("visible");
        });
    }

    function handleTargetLost(equipmentKey) {
        if (equipmentKey !== selectedEquipment) {
            return;
        }

        tracking = false;

        status.textContent =
            `Alvo perdido. Aponte novamente para: ${equipmentConfig[equipmentKey].label}`;

        badge.textContent = "PROCURANDO ALVO";

        hotspots.forEach((button) => {
            button.classList.remove("visible");
            button.style.visibility = "hidden";
        });

        hideInformation();
    }

    targets.braco.addEventListener("targetFound", () => {
        handleTargetFound("braco");
    });

    targets.braco.addEventListener("targetLost", () => {
        handleTargetLost("braco");
    });

    targets.movel.addEventListener("targetFound", () => {
        handleTargetFound("movel");
    });

    targets.movel.addEventListener("targetLost", () => {
        handleTargetLost("movel");
    });

    function updateHotspotPositions() {
        requestAnimationFrame(updateHotspotPositions);

        if (!tracking || !activeTarget?.object3D) {
            return;
        }

        const camera = cameraElement.getObject3D("camera");

        if (!camera) {
            return;
        }

        activeTarget.object3D.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);

        hotspots.forEach((button) => {
            const localPoint = new THREE.Vector3(
                Number(button.dataset.x),
                Number(button.dataset.y),
                Number(button.dataset.z)
            );

            const worldPoint =
                activeTarget.object3D.localToWorld(localPoint);

            const projectedPoint =
                worldPoint.clone().project(camera);

            const screenX =
                (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;

            const screenY =
                (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;

            button.style.left = `${screenX}px`;
            button.style.top = `${screenY}px`;

            const insideScreen =
                projectedPoint.z > -1 &&
                projectedPoint.z < 1 &&
                screenX > -80 &&
                screenX < window.innerWidth + 80 &&
                screenY > -80 &&
                screenY < window.innerHeight + 80;

            button.style.visibility =
                insideScreen ? "visible" : "hidden";
        });
    }

    updateHotspotPositions();
});
