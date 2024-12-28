const submissions = [];

export const uploadQuestionPaper = (data) => {
  submissions.push({ ...data, id: submissions.length + 1, status: "Pending" });
};

export const getSubmissions = () => submissions;

export const provideFeedback = (id, feedback) => {
  const submission = submissions.find((sub) => sub.id === id);
  if (submission) {
    submission.feedback = feedback;
  }
};

export const approveSubmission = (id) => {
  const submission = submissions.find((sub) => sub.id === id);
  if (submission) {
    submission.status = "Approved";
  }
};
