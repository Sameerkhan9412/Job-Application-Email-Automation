import mongoose, { Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  key: string;
  subjectDirect: string;
  subjectReferral: string;
  bodyDirect: string;
  bodyReferral: string;
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subjectDirect: {
      type: String,
      required: true,
    },
    subjectReferral: {
      type: String,
      required: true,
    },
    bodyDirect: {
      type: String,
      required: true,
    },
    bodyReferral: {
      type: String,
      required: true,
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Template =
  mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
