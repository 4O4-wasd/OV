import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  
  @Property({ unique: true })
  email!: string;

  
  @Property()
  name!: string;

  
  @Property({ unique: true })
  handle!: string;

  
  @Property({ hidden: true })
  passwordHash!: string;

  
  @Property({ default: false })
  emailVerified?: boolean;

  
  @Property({ onCreate: () => new Date() })
  createdAt?: Date;
}
