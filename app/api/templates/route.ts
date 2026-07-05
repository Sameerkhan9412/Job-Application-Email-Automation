import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Template from "@/models/Template";
import { verifyAuth } from "@/lib/utils";

const SEED_TEMPLATES = [
  {
    key: "associate_se",
    name: "Associate Software Engineer",
    subjectDirect: "Application for Associate Software Engineer at {{company}} | Immediate Joiner",
    subjectReferral: "Referral Request for Associate Software Engineer Role at {{company}}",
    bodyDirect: `<p>I hope you're doing well.</p>
<p>I am writing to express my interest in Associate Software Engineer roles at <strong>{{company}}</strong>. I am currently pursuing my MCA from AMU and have been building strong fundamentals in software engineering, data structures, and algorithms.</p>
<p>I have built full-stack applications using React, Node.js, and MongoDB, and solved over 300+ coding problems on various platforms. I also participated in the ISRO Hackathon, which helped me hone my collaborative problem-solving skills.</p>
<p>I am looking for an entry-level engineering role where I can contribute to your team and learn quickly. I am available to join immediately.</p>`,
    bodyReferral: `<p>I hope you're doing well.</p>
<p>I came across your profile and noticed your engineering work at <strong>{{company}}</strong>, which caught my interest. I am writing to ask if you would be open to referring me for Associate Software Engineer roles at your company.</p>
<p>I am currently pursuing my MCA from AMU and have built several full-stack MERN applications. I have strong fundamentals in DSA, with 300+ problems solved, and experience working in collaborative hackathons.</p>
<p>I have attached my resume and would appreciate any guidance or support you could offer. I am available to start immediately.</p>`,
    isBuiltIn: true,
  },
  {
    key: "fullstack",
    name: "Full Stack Developer",
    subjectDirect: "Application for Full Stack Developer at {{company}} | Immediate Joiner",
    subjectReferral: "Referral Request for Full Stack Developer Role at {{company}}",
    bodyDirect: `<p>I hope you're doing well.</p>
<p>I am writing to apply for the Full Stack Developer position at <strong>{{company}}</strong>. I specialize in the MERN stack (MongoDB, Express, React, Node.js) and Next.js, focusing on writing clean code and building scalable web applications.</p>
<p>I have built several production-ready projects, including an AI-powered coding platform (Codeway), integrating full-stack frameworks, secure databases, and responsive UI components.</p>
<p>I would love to bring my technical skills and enthusiasm for web development to your engineering team. I am available for an immediate start.</p>`,
    bodyReferral: `<p>I hope you're doing well.</p>
<p>I came across your profile and saw that you are working at <strong>{{company}}</strong>. I am reaching out to see if you would be open to referring me for Full Stack Developer roles at your company.</p>
<p>I specialize in MERN stack and Next.js, and have built projects like Codeway (an AI coding platform). I focus on clean architecture, scalable backends, and responsive frontends.</p>
<p>I have attached my resume and would be very grateful if you could refer me for a suitable opening. I am available to join immediately.</p>`,
    isBuiltIn: true,
  },
  {
    key: "devops",
    name: "DevOps Engineer",
    subjectDirect: "Application for DevOps Engineer at {{company}} | Immediate Joiner",
    subjectReferral: "Referral Request for DevOps / Infrastructure Role at {{company}}",
    bodyDirect: `<p>I hope you're doing well.</p>
<p>I'm writing to express my interest in DevOps / Cloud Engineer opportunities at <strong>{{company}}</strong>. Along with my software development foundation, I focus on containerization, deployment pipelines, and cloud infrastructure.</p>
<p>I have hands-on experience using Docker for containerizing applications, setting up CI/CD workflows, deploying applications to AWS EC2, and managing basic Linux servers. I enjoy bridging the gap between code and infrastructure to ensure reliable software delivery.</p>
<p>I am looking for an opportunity to contribute to your infrastructure team and am available to join immediately.</p>`,
    bodyReferral: `<p>I hope you're doing well.</p>
<p>I noticed your work at <strong>{{company}}</strong> and wanted to reach out. I am writing to ask if you'd be open to referring me for DevOps / Infrastructure roles at your company.</p>
<p>I combine software development basics with DevOps practices, including Docker containerization, CI/CD setup, AWS EC2 deployment, and server management. I'm keen on optimizing deployment and cloud infrastructure.</p>
<p>I have attached my resume and would be highly grateful for a referral. I am available to start immediately.</p>`,
    isBuiltIn: true,
  },
  {
    key: "fullstack_1yr",
    name: "Full Stack Developer (1+ Yr Exp)",
    subjectDirect: "Application for Full Stack Developer at {{company}} | Immediate Joiner",
    subjectReferral: "Referral Request for Full Stack Developer Role at {{company}}",
    bodyDirect: `<p>I hope you're doing well.</p>
<p>I am writing to apply for the Full Stack Developer position at <strong>{{company}}</strong>. I have over a year of hands-on development experience, including working as a Software Engineer Intern at Technopedia Soft.</p>
<p>In my previous roles, I have developed and maintained scalable healthcare and web platforms, optimized backend API performance, and integrated secure payment gateways. I am proficient in React, Next.js, Node.js, and database architectures, and I have a proven track record of shipping reliable features for real-world users.</p>
<p>I would be excited to contribute my experience to your engineering team and start working on your core products immediately.</p>`,
    bodyReferral: `<p>I hope you're doing well.</p>
<p>I came across your profile and saw your work at <strong>{{company}}</strong>. I am reaching out to ask if you could refer me for Full Stack Developer roles at your company.</p>
<p>I have over a year of development experience (including an internship at Technopedia Soft) building scalable healthcare platforms, optimizing APIs, and working with React/Next.js/Node.js. I have a track record of building production features from scratch.</p>
<p>I would appreciate the chance to be referred. I've attached my resume and would love to chat further. I am available immediately.</p>`,
    isBuiltIn: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const count = await Template.countDocuments();
    if (count === 0) {
      // Seed default templates
      await Template.create(SEED_TEMPLATES);
    }

    const templates = await Template.find().sort({ createdAt: 1 });
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Templates GET Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id, name, key, subjectDirect, subjectReferral, bodyDirect, bodyReferral } = await req.json();

    if (!name || !key || !subjectDirect || !subjectReferral || !bodyDirect || !bodyReferral) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_");

    if (id) {
      // Update template
      const existing = await Template.findById(id);
      if (!existing) {
        return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
      }

      // Check key collision if key is changing
      if (existing.key !== cleanKey) {
        const keyColl = await Template.findOne({ key: cleanKey });
        if (keyColl) {
          return NextResponse.json({ success: false, message: "Template key must be unique" }, { status: 400 });
        }
      }

      existing.name = name;
      existing.key = cleanKey;
      existing.subjectDirect = subjectDirect;
      existing.subjectReferral = subjectReferral;
      existing.bodyDirect = bodyDirect;
      existing.bodyReferral = bodyReferral;

      await existing.save();
      return NextResponse.json({ success: true, template: existing });
    } else {
      // Create new template
      const keyColl = await Template.findOne({ key: cleanKey });
      if (keyColl) {
        return NextResponse.json({ success: false, message: "Template key must be unique" }, { status: 400 });
      }

      const newTemplate = await Template.create({
        name,
        key: cleanKey,
        subjectDirect,
        subjectReferral,
        bodyDirect,
        bodyReferral,
        isBuiltIn: false,
      });

      return NextResponse.json({ success: true, template: newTemplate });
    }
  } catch (error: any) {
    console.error("Template POST Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Template ID is required" }, { status: 400 });
    }

    const template = await Template.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
    }

    if (template.isBuiltIn) {
      return NextResponse.json({ success: false, message: "Built-in templates cannot be deleted" }, { status: 400 });
    }

    await Template.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("Template DELETE Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
