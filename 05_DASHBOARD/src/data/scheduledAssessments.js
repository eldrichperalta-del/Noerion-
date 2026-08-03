export const scheduledAssessments = [];

export const addScheduledAssessment = (assessment) => {
  scheduledAssessments.unshift(assessment);
  return assessment;
};
