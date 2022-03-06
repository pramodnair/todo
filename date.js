module.exports.getDate = function () {
  const today = new Date();
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return today.toLocaleDateString("us-EN", options);
};