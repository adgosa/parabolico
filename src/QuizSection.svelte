<script>
    import Quiz from "./Quiz.svelte";

    const maxQuestions = 10;

    let availableQuestions = [
        {
            validAnswerIndex: 1,
            title: "¿De qué grado es una función cuadrática?",
            answers: [
                "Tercer grado",
                "Segundo grado",
                "Primer grado",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 2,
            title: "¿En qué método se utiliza la resolvente?",
            answers: [
                "Método parabólico",
                "Método por tabla",
                "Método directo",
                "Método de segundo grado",
            ],
        },
        {
            validAnswerIndex: 3,
            title: "En la siguiente función: <code>y=4x^2-3x+2</code> ¿cuál es el valor de a, b y c?",
            answers: ["-3;2;4", "2;-4;-3", "4;-3;2", "4;3;2"],
        },
        {
            validAnswerIndex: 0,
            title: "¿En qué afecta que el término cuadrático sea negativo o positivo?",
            answers: [
                "Determina si es creciente o decreciente",
                "Determina si la función es par o impar",
                "A y B son correctas",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 1,
            title: "¿La ecuación <code>y=x^3+3x-4</code> es correcta cuadráticamente?",
            answers: ["Sí", "No"],
        },
        {
            validAnswerIndex: 3,
            title: "¿Qué letra representa al término independiente?",
            answers: ["a", "b", "c", "Ninguna es correcta"],
        },
        {
            validAnswerIndex: 1,
            title: "¿Cómo se calcula la coord. al origen?",
            answers: [
                "Resolviendo la resolvente",
                "Es el valor independiente",
                "La suma de las raíces dividido 2",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 1,
            title: "La ecuación <code>y=x^2+7x</code> es:",
            answers: ["Completa", "Incompleta", "Mixta"],
        },
        {
            validAnswerIndex: 0,
            title: "¿Qué es el discriminante?",
            answers: [
                "Lo que se encuentra dentro de la raíz de la resolvente",
                "Es el sentido de la parábola",
                "El resultado de la resolvente",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 0,
            title: "¿Qué termino es indispensable para una f. cuadrática?",
            answers: ["a", "b", "c", "a;b"],
        },
        {
            validAnswerIndex: 3,
            title: "¿Cuándo una f. cuadrática está incompleta?",
            answers: [
                "Al faltar b",
                "Al faltar c",
                "Al faltar b;c",
                "Todas son correctas",
            ],
        },
        {
            validAnswerIndex: 3,
            title: "¿Cuál de estas afirmaciones es la correcta?",
            answers: [
                "La función es par si a 2 elementos opuestos del dominio le corresponden distinta imagen",
                "La función es impar si a 2 elementos opuetos del dominio le corresponden distinta imagen",
                "La función cuadrática forma una linea recta",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 1,
            title: "La representación de la f. cuadrática es una curva llamada:",
            answers: [
                "Linea cuadrática",
                "Parábola",
                "Discriminante",
                "A y B son correctas",
            ],
        },
        {
            validAnswerIndex: 4,
            title: "Dada la ecuación <code>y=x^2-2</code> ¿qué afirmación es correcta?",
            answers: [
                "Es par",
                "Es impar",
                "Es una ecuación incompleta",
                "A y B son correctas",
                "A y C son correctas",
                "Ninguna es correcta",
            ],
        },
        {
            validAnswerIndex: 4,
            title: "Dada la ecuación <code>y=x^2+1</code> ¿qué afirmación es correcta?",
            answers: [
                "Es impar",
                "Su imagen es [1,∞]",
                "Es par",
                "A y B son correctas",
                "B y C son correctas",
                "Ninguna es correcta",
            ],
        },
    ];

    let selectedQuestions = pickRandomQuestions(10);

    function pickRandomQuestions(count) {
        const tmp = availableQuestions.slice(availableQuestions);
        const ret = [];

        for (let i = 0; i < count; i++) {
            let index = Math.floor(Math.random() * tmp.length);
            const removed = tmp.splice(index, 1);

            ret.push(removed[0]);
        }

        return ret;
    }
</script>

<div class="outer-box">
    <div class="elements-container">
        <Quiz {selectedQuestions} {maxQuestions} />
    </div>
</div>

<style>
    .outer-box {
        background-color: var(--light-clr);
        border: 5px solid black;
        border-radius: 48px;
        text-align: center;
        min-width: 55vw;
    }

    .elements-container {
        padding: 1em 15vw;
    }
</style>
