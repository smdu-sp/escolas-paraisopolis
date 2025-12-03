/*
  Warnings:

  - You are about to drop the `_CadastroToPontoInteresse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alunos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `apontamentos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cadastros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `locais_reuniao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pontos_interesse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pontos_sugeridos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_CadastroToPontoInteresse` DROP FOREIGN KEY `_CadastroToPontoInteresse_A_fkey`;

-- DropForeignKey
ALTER TABLE `_CadastroToPontoInteresse` DROP FOREIGN KEY `_CadastroToPontoInteresse_B_fkey`;

-- DropForeignKey
ALTER TABLE `alunos` DROP FOREIGN KEY `alunos_cadastroId_fkey`;

-- DropForeignKey
ALTER TABLE `apontamentos` DROP FOREIGN KEY `apontamentos_cadastroId_fkey`;

-- DropForeignKey
ALTER TABLE `cadastros` DROP FOREIGN KEY `cadastros_escolaId_fkey`;

-- DropForeignKey
ALTER TABLE `locais_reuniao` DROP FOREIGN KEY `locais_reuniao_cadastroId_fkey`;

-- DropForeignKey
ALTER TABLE `pontos_sugeridos` DROP FOREIGN KEY `pontos_sugeridos_cadastroId_fkey`;

-- AlterTable
ALTER TABLE `escolas` MODIFY `endereco` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `_CadastroToPontoInteresse`;

-- DropTable
DROP TABLE `alunos`;

-- DropTable
DROP TABLE `apontamentos`;

-- DropTable
DROP TABLE `cadastros`;

-- DropTable
DROP TABLE `locais_reuniao`;

-- DropTable
DROP TABLE `pontos_interesse`;

-- DropTable
DROP TABLE `pontos_sugeridos`;

-- CreateTable
CREATE TABLE `respostas` (
    `id` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `escolaId` VARCHAR(191) NOT NULL,
    `temReuniao` BOOLEAN NOT NULL DEFAULT false,
    `usuarioIdOpcional` VARCHAR(191) NULL,

    INDEX `respostas_escolaId_idx`(`escolaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pontos` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ORIGEM', 'REFERENCIA', 'REUNIAO') NOT NULL,
    `nomeLocal` VARCHAR(191) NULL,
    `latitude` DECIMAL(11, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `ordem` INTEGER NULL,

    INDEX `pontos_respostaId_tipo_idx`(`respostaId`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criancas` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `dataNascimento` DATE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transportes` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `sentido` ENUM('IDA', 'VOLTA') NOT NULL,
    `tipoCodigo` VARCHAR(191) NOT NULL,
    `descricaoLivre` VARCHAR(191) NULL,

    INDEX `transportes_respostaId_sentido_idx`(`respostaId`, `sentido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acompanhantes` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `tipoCodigo` VARCHAR(191) NOT NULL,
    `descricaoLivre` VARCHAR(191) NULL,

    INDEX `acompanhantes_respostaId_idx`(`respostaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metricas_sentimento` (
    `id` VARCHAR(191) NOT NULL,
    `chave` ENUM('RUAS_CALCADAS', 'LIXO', 'ESGOTO', 'SEGURANCA', 'VELOCIDADE') NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `metricas_sentimento_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sentimentos_resposta` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `metricaId` VARCHAR(191) NOT NULL,
    `nota` SMALLINT NOT NULL,

    UNIQUE INDEX `sentimentos_resposta_respostaId_metricaId_key`(`respostaId`, `metricaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problemas` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `texto` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sugestoes` (
    `id` VARCHAR(191) NOT NULL,
    `respostaId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `texto` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `respostas` ADD CONSTRAINT `respostas_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pontos` ADD CONSTRAINT `pontos_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `criancas` ADD CONSTRAINT `criancas_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transportes` ADD CONSTRAINT `transportes_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acompanhantes` ADD CONSTRAINT `acompanhantes_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sentimentos_resposta` ADD CONSTRAINT `sentimentos_resposta_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sentimentos_resposta` ADD CONSTRAINT `sentimentos_resposta_metricaId_fkey` FOREIGN KEY (`metricaId`) REFERENCES `metricas_sentimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problemas` ADD CONSTRAINT `problemas_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sugestoes` ADD CONSTRAINT `sugestoes_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `respostas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
