import emailjs from 'emailjs-com';

export const useSendRejectionEmail = () => {
  const sendRejectionEmail = async ({ teacherMail, subject, facultyName, feedback }) => {
    console.log("EmailJS recipient (teacherMail):", teacherMail);
    const templateParams = {
      to_email: teacherMail,
      title: subject,
      name: facultyName,
      message: feedback,
     
    };

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const userId = import.meta.env.VITE_EMAILJS_USER_ID;

    return emailjs.send(serviceId, templateId, templateParams, userId);
  };

  return { sendRejectionEmail };
};
