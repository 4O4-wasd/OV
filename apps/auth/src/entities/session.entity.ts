import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from './user.entity.js';

@Entity()
export class Session {
  @PrimaryKey()
  id!: number;

  
  @ManyToOne(() => User)
  user!: User;

  
  @Property({ unique: true })
  tokenHash!: string;

  
  @Property({ nullable: true })
  ip?: string;

  
  @Property({ nullable: true })
  userAgent?: string;

  
  @Property({ onCreate: () => new Date() })
  createdAt?: Date;
}
