const removeRazorpay = () => {
  const script = document.getElementById("razorpay-script");

  if (script) {
    script.remove();
  }

  delete window.Razorpay;
};
export default removeRazorpay;