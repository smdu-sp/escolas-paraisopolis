-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `login` VARCHAR(191) NOT NULL,
    `permissao` ENUM('DEV', 'ADM') NOT NULL DEFAULT 'ADM',
    `status` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escolas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(11, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` VARCHAR(191) NOT NULL,
    `dataNasc` DATE NOT NULL,
    `cadastroId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pontos_interesse` (
    `id` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(11, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pontos_sugeridos` (
    `id` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(11, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `cadastroId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apontamentos` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `cadastroId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PROBLEMA', 'SUGESTAO') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locais_reuniao` (
    `id` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(11, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `cadastroId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cadastros` (
    `id` VARCHAR(191) NOT NULL,
    `escolaId` VARCHAR(191) NOT NULL,
    `transporteIda` VARCHAR(191) NOT NULL,
    `acompanhanteIda` VARCHAR(191) NOT NULL,
    `transporteVolta` VARCHAR(191) NOT NULL,
    `acompanhanteVolta` VARCHAR(191) NOT NULL,
    `casaLatitude` DECIMAL(11, 8) NOT NULL,
    `casaLongitude` DECIMAL(11, 8) NOT NULL,
    `sensacao` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CadastroToPontoInteresse` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CadastroToPontoInteresse_AB_unique`(`A`, `B`),
    INDEX `_CadastroToPontoInteresse_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alunos` ADD CONSTRAINT `alunos_cadastroId_fkey` FOREIGN KEY (`cadastroId`) REFERENCES `cadastros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pontos_sugeridos` ADD CONSTRAINT `pontos_sugeridos_cadastroId_fkey` FOREIGN KEY (`cadastroId`) REFERENCES `cadastros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apontamentos` ADD CONSTRAINT `apontamentos_cadastroId_fkey` FOREIGN KEY (`cadastroId`) REFERENCES `cadastros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locais_reuniao` ADD CONSTRAINT `locais_reuniao_cadastroId_fkey` FOREIGN KEY (`cadastroId`) REFERENCES `cadastros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cadastros` ADD CONSTRAINT `cadastros_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `escolas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CadastroToPontoInteresse` ADD CONSTRAINT `_CadastroToPontoInteresse_A_fkey` FOREIGN KEY (`A`) REFERENCES `cadastros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CadastroToPontoInteresse` ADD CONSTRAINT `_CadastroToPontoInteresse_B_fkey` FOREIGN KEY (`B`) REFERENCES `pontos_interesse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
