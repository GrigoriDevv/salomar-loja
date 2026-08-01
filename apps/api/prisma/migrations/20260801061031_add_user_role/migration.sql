-- CreateEnum
CREATE TYPE "Role" AS ENUM ('cliente', 'atendente', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'cliente';
