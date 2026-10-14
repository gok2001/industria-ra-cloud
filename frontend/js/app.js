document.addEventListener(
    "DOMContentLoaded",
    () => {


        const scene =
            document.querySelector("#ar-scene");

        const target =
            document.querySelector("#target");

        const cameraElement =
            document.querySelector("#ar-camera");


        const status =
            document.querySelector("#status");

        const badge =
            document.querySelector("#badge");

        const panel =
            document.querySelector("#info-panel");

        const panelTitle =
            document.querySelector("#info-title");

        const panelText =
            document.querySelector("#info-text");

        const panelDetail =
            document.querySelector("#info-detail");

        const closeButton =
            document.querySelector("#close-panel");


        const hotspots =
            Array.from(
                document.querySelectorAll(".hotspot")
            );


        let tracking =
            false;


        const information = {

            base: {

                title:
                    "Base do robô industrial",

                text:
                    "A base sustenta o robô e permite que a estrutura permaneça posicionada de forma estável durante a operação.",

                detail:
                    "A estabilidade da base é importante para o funcionamento adequado do equipamento."
            },


            braco: {

                title:
                    "Braço do robô industrial",

                text:
                    "O braço realiza os movimentos principais do robô e permite posicionar o conjunto mecânico em diferentes pontos de trabalho.",

                detail:
                    "Os movimentos variam de acordo com o modelo e a aplicação do robô."
            },


            punho: {

                title:
                    "Punho do robô",

                text:
                    "O punho está localizado na extremidade do braço e permite orientar corretamente a ferramenta utilizada pelo robô.",

                detail:
                    "A configuração do punho depende do modelo e da aplicação do equipamento."
            },


            garra: {

                title:
                    "Garra do robô",

                text:
                    "A garra é o elemento responsável por segurar, movimentar ou manipular objetos durante determinadas operações.",

                detail:
                    "O tipo de garra utilizado depende da atividade realizada pelo robô."
            }

        };


        function showInformation(topicName) {

            const selected =
                information[topicName];


            if (!selected) {
                return;
            }


            panelTitle.textContent =
                selected.title;

            panelText.textContent =
                selected.text;

            panelDetail.textContent =
                selected.detail;


            /*
             * Remove a classe hidden
             * e mostra o painel.
             */
            panel.classList.remove(
                "hidden"
            );
        }


        function hideInformation() {

            panel.classList.add(
                "hidden"
            );
        }


        hotspots.forEach(
            (button) => {

                button.addEventListener(
                    "pointerup",
                    (event) => {

                        event.preventDefault();

                        event.stopPropagation();


                        /*
                         * Lê o data-topic do botão.
                         */
                        const topicName =
                            button.dataset.topic;


                        showInformation(
                            topicName
                        );
                    }
                );
            }
        );


        closeButton.addEventListener(
            "pointerup",
            (event) => {

                event.preventDefault();

                hideInformation();
            }
        );


        scene.addEventListener(
            "arReady",
            () => {

                status.textContent =
                    "Câmera pronta. Aponte para a imagem do robô.";

                badge.textContent =
                    "PROCURANDO ALVO";
            }
        );


        scene.addEventListener(
            "arError",
            () => {

                status.textContent =
                    "Não foi possível iniciar a câmera.";

                badge.textContent =
                    "ERRO";
            }
        );


        target.addEventListener(
            "targetFound",
            () => {

                tracking =
                    true;


                status.textContent =
                    "Robô reconhecido. Toque em um ponto numerado.";

                badge.textContent =
                    "● RA ATIVA";


                hotspots.forEach(
                    (button) => {

                        button.classList.add(
                            "visible"
                        );
                    }
                );
            }
        );


        target.addEventListener(
            "targetLost",
            () => {

                tracking =
                    false;


                status.textContent =
                    "Alvo perdido. Aponte novamente para a imagem.";

                badge.textContent =
                    "PROCURANDO ALVO";


                hotspots.forEach(
                    (button) => {

                        button.classList.remove(
                            "visible"
                        );
                    }
                );


                hideInformation();
            }
        );


        function updateHotspotPositions() {


            /*
             * Agenda a próxima atualização.
             */
            requestAnimationFrame(
                updateHotspotPositions
            );


            if (!tracking) {
                return;
            }


            const camera =
                cameraElement.getObject3D(
                    "camera"
                );


            if (
                !camera ||
                !target.object3D
            ) {
                return;
            }


            target.object3D.updateMatrixWorld(
                true
            );

            camera.updateMatrixWorld(
                true
            );


            hotspots.forEach(
                (button) => {


                    const localPoint =
                        new THREE.Vector3(
                            Number(button.dataset.x),
                            Number(button.dataset.y),
                            Number(button.dataset.z)
                        );


                    const worldPoint =
                        target.object3D.localToWorld(
                            localPoint
                        );


                    const projectedPoint =
                        worldPoint
                            .clone()
                            .project(
                                camera
                            );


                    const screenX =
                        (
                            projectedPoint.x * 0.5 +
                            0.5
                        ) *
                        window.innerWidth;


                    const screenY =
                        (
                            -projectedPoint.y * 0.5 +
                            0.5
                        ) *
                        window.innerHeight;


                    button.style.left =
                        `${screenX}px`;

                    button.style.top =
                        `${screenY}px`;


                    const insideScreen =
                        projectedPoint.z > -1 &&
                        projectedPoint.z < 1 &&
                        screenX > -80 &&
                        screenX < window.innerWidth + 80 &&
                        screenY > -80 &&
                        screenY < window.innerHeight + 80;


                    button.style.visibility =
                        insideScreen
                            ? "visible"
                            : "hidden";
                }
            );
        }

        updateHotspotPositions();

    }
);