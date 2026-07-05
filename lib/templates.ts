const escapeHtml = (str: string) =>
  str
    ?.replace(/&/g, "&amp;")
    ?.replace(/</g, "&lt;")
    ?.replace(/>/g, "&gt;")
    ?.replace(/"/g, "&quot;")
    ?.replace(/'/g, "&#039;") || "";

export const getEmailTemplate = (
  role: "associate_se" | "fullstack" | "devops" | "fullstack_1yr",
  type: "direct" | "referral",
  hrName: string,
  companyName: string
): string => {
  const safeHr = escapeHtml(hrName || (type === "referral" ? "there" : "Hiring Team"));
  const safeCompany = escapeHtml(companyName || "your company");

  const greeting = type === "referral" ? `Hi ${safeHr} sir,` : `Hi ${safeHr},`;

  let body = "";

  if (role === "associate_se") {
    if (type === "direct") {
      body = `
        <p>I hope you're doing well.</p>
        <p>I am writing to express my interest in Associate Software Engineer roles at <strong>${safeCompany}</strong>. I am currently pursuing my MCA from AMU and have been building strong fundamentals in software engineering, data structures, and algorithms.</p>
        <p>I have built full-stack applications using React, Node.js, and MongoDB, and solved over 300+ coding problems on various platforms. I also participated in the ISRO Hackathon, which helped me hone my collaborative problem-solving skills.</p>
        <p>I am looking for an entry-level engineering role where I can contribute to your team and learn quickly. I am available to join immediately.</p>
      `;
    } else {
      body = `
        <p>I hope you're doing well.</p>
        <p>I came across your profile and noticed your engineering work at <strong>${safeCompany}</strong>, which caught my interest. I am writing to ask if you would be open to referring me for Associate Software Engineer roles at your company.</p>
        <p>I am currently pursuing my MCA from AMU and have built several full-stack MERN applications. I have strong fundamentals in DSA, with 300+ problems solved, and experience working in collaborative hackathons.</p>
        <p>I have attached my resume and would appreciate any guidance or support you could offer. I am available to start immediately.</p>
      `;
    }
  } else if (role === "devops") {
    if (type === "direct") {
      body = `
        <p>I hope you're doing well.</p>
        <p>I'm writing to express my interest in DevOps / Cloud Engineer opportunities at <strong>${safeCompany}</strong>. Along with my software development foundation, I focus on containerization, deployment pipelines, and cloud infrastructure.</p>
        <p>I have hands-on experience using Docker for containerizing applications, setting up CI/CD workflows, deploying applications to AWS EC2, and managing basic Linux servers. I enjoy bridging the gap between code and infrastructure to ensure reliable software delivery.</p>
        <p>I am looking for an opportunity to contribute to your infrastructure team and am available to join immediately.</p>
      `;
    } else {
      body = `
        <p>I hope you're doing well.</p>
        <p>I noticed your work at <strong>${safeCompany}</strong> and wanted to reach out. I am writing to ask if you'd be open to referring me for DevOps / Infrastructure roles at your company.</p>
        <p>I combine software development basics with DevOps practices, including Docker containerization, CI/CD setup, AWS EC2 deployment, and server management. I'm keen on optimizing deployment and cloud infrastructure.</p>
        <p>I have attached my resume and would be highly grateful for a referral. I am available to start immediately.</p>
      `;
    }
  } else if (role === "fullstack_1yr") {
    if (type === "direct") {
      body = `
        <p>I hope you're doing well.</p>
        <p>I am writing to apply for the Full Stack Developer position at <strong>${safeCompany}</strong>. I have over a year of hands-on development experience, including working as a Software Engineer Intern at Technopedia Soft.</p>
        <p>In my previous roles, I have developed and maintained scalable healthcare and web platforms, optimized backend API performance, and integrated secure payment gateways. I am proficient in React, Next.js, Node.js, and database architectures, and I have a proven track record of shipping reliable features for real-world users.</p>
        <p>I would be excited to contribute my experience to your engineering team and start working on your core products immediately.</p>
      `;
    } else {
      body = `
        <p>I hope you're doing well.</p>
        <p>I came across your profile and saw your work at <strong>${safeCompany}</strong>. I am reaching out to ask if you could refer me for Full Stack Developer roles at your company.</p>
        <p>I have over a year of development experience (including an internship at Technopedia Soft) building scalable healthcare platforms, optimizing APIs, and working with React/Next.js/Node.js. I have a track record of building production features from scratch.</p>
        <p>I would appreciate the chance to be referred. I've attached my resume and would love to chat further. I am available immediately.</p>
      `;
    }
  } else {
    // Default: "fullstack"
    if (type === "direct") {
      body = `
        <p>I hope you're doing well.</p>
        <p>I am writing to apply for the Full Stack Developer position at <strong>${safeCompany}</strong>. I specialize in the MERN stack (MongoDB, Express, React, Node.js) and Next.js, focusing on writing clean code and building scalable web applications.</p>
        <p>I have built several production-ready projects, including an AI-powered coding platform (Codeway), integrating full-stack frameworks, secure databases, and responsive UI components.</p>
        <p>I would love to bring my technical skills and enthusiasm for web development to your engineering team. I am available for an immediate start.</p>
      `;
    } else {
      body = `
        <p>I hope you're doing well.</p>
        <p>I came across your profile and saw that you are working at <strong>${safeCompany}</strong>. I am reaching out to see if you would be open to referring me for Full Stack Developer roles at your company.</p>
        <p>I specialize in MERN stack and Next.js, and have built projects like Codeway (an AI coding platform). I focus on clean architecture, scalable backends, and responsive frontends.</p>
        <p>I have attached my resume and would be very grateful if you could refer me for a suitable opening. I am available to join immediately.</p>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application</title>
</head>
<body style="margin: 0; padding: 20px 0; background: #ffffff; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0 10px;">
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    
    ${body}
    
    <p style="margin: 24px 0 0 0; color: #111827;">
      Best regards,<br/>
      <strong>Sameer</strong><br/>
      Email: <a href="mailto:sameerkhan.cse1@gmail.com" style="color: #2563eb; text-decoration: underline;">sameerkhan.cse1@gmail.com</a><br/>
      Phone: <a href="tel:+919412803911" style="color: #2563eb; text-decoration: underline;">+91 9412803911</a><br/>
      Portfolio: <a href="https://sameerwork.netlify.app" style="color: #2563eb; text-decoration: underline;">sameerwork.netlify.app</a><br/>
      GitHub: <a href="https://github.com/sameerkhan9412" style="color: #2563eb; text-decoration: underline;">github.com/sameerkhan9412</a><br/>
      LinkedIn: <a href="https://linkedin.com/in/sameerkhn" style="color: #2563eb; text-decoration: underline;">linkedin.com/in/sameerkhn</a><br/>
      Resume: <a href="https://drive.google.com/file/d/1_Ky8_5W-IkpzoDCGfBNu1sVPCalUOtab" style="color: #2563eb; text-decoration: underline;">View Resume</a>
    </p>
  </div>
</body>
</html>
  `.trim();
};