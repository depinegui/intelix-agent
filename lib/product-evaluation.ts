export const productEvaluationQuestions = [
  {
    key: "easeOfUse",
    title: "Foi fácil entender como utilizar o Intelix Agent?",
    options: [
      "Muito difícil",
      "Difícil",
      "Neutro",
      "Fácil",
      "Muito fácil",
    ],
  },
  {
    key: "relevance",
    title: "As respostas apresentadas pelo agente foram relevantes para a dúvida informada?",
    options: [
      "Nada relevantes",
      "Pouco relevantes",
      "Razoavelmente relevantes",
      "Relevantes",
      "Muito relevantes",
    ],
  },
  {
    key: "responseTime",
    title: "O tempo de resposta do sistema foi satisfatório?",
    options: [
      "Muito insatisfatório",
      "Insatisfatório",
      "Neutro",
      "Satisfatório",
      "Muito satisfatório",
    ],
  },
  {
    key: "reuseIntent",
    title: "Você utilizaria o Intelix Agent novamente para buscar auxílio em dúvidas sobre o sistema ERP?",
    options: [
      "Com certeza não",
      "Provavelmente não",
      "Talvez",
      "Provavelmente sim",
      "Com certeza sim",
    ],
  },
] as const;

export type ProductEvaluationQuestionKey =
  (typeof productEvaluationQuestions)[number]["key"];
