// src/entities/Image.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Property } from "./Property";

@Entity("images")
export class Image {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column()
  publicId: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ default: false })
  isPrimary: boolean;

  @ManyToOne(() => Property, (property) => property.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @Column()
  propertyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
