-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 20, 2024 at 09:03 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `login_react`
--

-- --------------------------------------------------------

--
-- Table structure for table `basis_pengetahuan`
--

CREATE TABLE `basis_pengetahuan` (
  `id` int(11) NOT NULL,
  `kode_gejala` varchar(10) NOT NULL,
  `kode_kerusakan` varchar(10) NOT NULL,
  `bobot_gejala` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `basis_pengetahuan`
--

INSERT INTO `basis_pengetahuan` (`id`, `kode_gejala`, `kode_kerusakan`, `bobot_gejala`) VALUES
(1, 'G01', 'K01', 0.6),
(2, 'G02', 'K01', 0.8),
(3, 'G03', 'K01', 0.2),
(4, 'G03', 'K03', 0.6),
(5, 'G04', 'K02', 0.4),
(6, 'G04', 'K06', 0.4),
(7, 'G04', 'K07', 0.4),
(8, 'G05', 'K02', 0.6),
(9, 'G06', 'K02', 0.4),
(10, 'G07', 'K03', 0.5),
(11, 'G07', 'K04', 0.5),
(12, 'G07', 'K05', 0.5),
(13, 'G08', 'K03', 0.4),
(14, 'G09', 'K04', 0.8),
(15, 'G10', 'K05', 0.8),
(16, 'G11', 'K06', 0.4),
(17, 'G11', 'K07', 0.4),
(18, 'G12', 'K06', 0.4),
(20, 'G13', 'K06', 0.3),
(21, 'G14', 'K06', 0.4),
(22, 'G15', 'K07', 0.6),
(23, 'G16', 'K02', 0.8),
(24, 'G17', 'K06', 0.8);

-- --------------------------------------------------------

--
-- Table structure for table `gejala`
--

CREATE TABLE `gejala` (
  `id` int(11) NOT NULL,
  `kode_gejala` varchar(10) NOT NULL,
  `gejala` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gejala`
--

INSERT INTO `gejala` (`id`, `kode_gejala`, `gejala`) VALUES
(1, 'G01', 'Suara mesin kasar'),
(2, 'G02', 'Knalpot berasap putih'),
(3, 'G03', 'Tenaga mesin berkurang'),
(4, 'G04', 'Motor brebet'),
(5, 'G05', 'Pengapian hilang'),
(6, 'G06', 'Sekring pada CDI putus'),
(7, 'G07', 'Suara kasar pada bagian CVT'),
(8, 'G08', 'Motor tersendat-sendat'),
(9, 'G09', 'Suara kasar/ kretek-kretek pada roda belakang jika diputar'),
(10, 'G10', 'V-belt sering putus'),
(11, 'G11', 'Motor tiba-tiba mati'),
(12, 'G12', 'Bensin boros'),
(13, 'G13', 'Motor sulit distarter'),
(14, 'G14', 'Warna asap knalpot pekat'),
(15, 'G15', 'Motor susah dihidupkan'),
(16, 'G16', 'Motor mati'),
(17, 'G17', 'Motor nyendat saat gas full');

-- --------------------------------------------------------

--
-- Table structure for table `kerusakan`
--

CREATE TABLE `kerusakan` (
  `id` int(11) NOT NULL,
  `kode_kerusakan` varchar(10) NOT NULL,
  `kerusakan` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kerusakan`
--

INSERT INTO `kerusakan` (`id`, `kode_kerusakan`, `kerusakan`) VALUES
(1, 'K01', 'Kerusakan pada piston'),
(2, 'K02', 'Kerusakan pada CDI/ECM'),
(3, 'K03', 'Kerusakan pada rumah roller CVT'),
(4, 'K04', 'Kerusakan pada bearing CVT'),
(5, 'K05', 'Kerusakan pada pulley sekunder'),
(6, 'K06', 'Kerusakan sistem injeksi'),
(7, 'K07', 'Kerusakan busi');

-- --------------------------------------------------------

--
-- Table structure for table `probabilitas`
--

CREATE TABLE `probabilitas` (
  `id` int(11) NOT NULL,
  `kode_kerusakan` varchar(10) NOT NULL,
  `probabilitas` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `probabilitas`
--

INSERT INTO `probabilitas` (`id`, `kode_kerusakan`, `probabilitas`) VALUES
(1, 'K01', 0.5),
(2, 'K02', 0.5),
(3, 'K03', 0.5),
(4, 'K04', 0.5),
(5, 'K05', 0.5),
(6, 'K06', 0.5),
(7, 'K07', 0.5);

-- --------------------------------------------------------

--
-- Table structure for table `rule_aturan`
--

CREATE TABLE `rule_aturan` (
  `id` int(11) NOT NULL,
  `rule_kondisi` varchar(255) NOT NULL,
  `hasil` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rule_aturan`
--

INSERT INTO `rule_aturan` (`id`, `rule_kondisi`, `hasil`) VALUES
(1, 'G01,G02,G03', 'K01'),
(2, 'G04,G05,G06,G16', 'K02'),
(3, 'G03,G07,G08', 'K03'),
(4, 'G07,G09', 'K04'),
(5, 'G07,G10', 'K05'),
(6, 'G04,G11,G12,G13,G14,G17', 'K06'),
(7, 'G04,G11,G12,G15', 'K07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(3) NOT NULL,
  `email` varchar(500) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `date`) VALUES
(1, 'somu@gmail.com', '$2b$10$xY6mo4clHl8tHxZ12F3xf.i8CmqNsFUEkxXdCBTzzQWWDEwiY4yfS', '2021-06-26 11:37:39'),
(2, 'somuu@gmail.com', '$2b$10$GVcA24UNAJlV3dU5zgFCRuU4s9bn0nUhaYVZRu.JVziZ3VgmRzAsu', '2021-06-26 11:38:13'),
(3, 'ram@gmail.com', '$2b$10$0bp6mwJ2aJnTh3LuGpJtTuMSVqw1WNQJbK7EL6A8R59.OPPGJqgc2', '2021-06-26 11:46:15'),
(4, 'atanuj383@gmail.com', '$2b$10$NN2z7zs6loysoI8OEda1xelBhuM6Crrh/woHyYHzLJeE9i3Uir//6', '2021-06-26 12:22:18'),
(5, 'atanuj5@gmail.com', '$2b$10$fKTJbChGRpZLgRkXS6moA.zQATJ8jVoBU66wV57vkeE36qfGetLdG', '2021-06-26 12:27:05'),
(6, 'atanuj55@gmail.com', '$2b$10$nnbEitRzcfPwd28a7XGc8e00Zvm38sob6I8Bv8nyxOVeV4ccUA53G', '2021-06-26 12:27:55'),
(7, 'rajuahamed.kh@gmail.com', '$2b$10$pDrNNqqSNibwoH/1fPW9t.9LUgbY28kge4FLcH0BYKhscvTDFUAum', '2021-06-26 14:45:36'),
(8, 'kkk@gmail.com', '$2b$10$WvfdXiguQbF8zoSfXy7qGeneV0XGSdgIMGriRppaJgi.vQjfiwMhi', '2021-06-26 15:02:13'),
(9, 'samrat1@gmail.com', '$2b$10$dXEjGzCNaPlRybHMRnK06.cbwnA6vTkSjld2q9xKLbDGZEilP7QFq', '2021-06-26 17:45:07'),
(10, 'coba@gmail.com', '$2b$10$S34LJ9obx2CLHkeAMW9bPeMIN1nRHOECE8nLnyih4bYkdHQIj.BS2', '2024-04-18 18:26:27'),
(11, 'admin@gmail.com', '$2b$10$vfWDEky3iegzE2sATD6EI.lA91kWUEV87jwzYddgD2D09VnjwlusC', '2024-04-18 19:09:40'),
(12, 'k@gmail.com', '$2b$10$dDEbzEjFkmY9ZPELfy86jeKRfB/xiiGquA5bJZ.9d5BdTmgy8wvB6', '2024-04-19 18:58:26'),
(13, 'gg@gmail.com', '$2b$10$uNQuSIWG1dVyPCXNIfDaK.Hk0i44VZ.H6Y1Tw087TEoseAKRIgWL6', '2024-04-19 19:02:59'),
(14, 'kk@gmail.com', '$2b$10$8eCxOG/0npU9WUw14dcg2.DaScy5Znim2PVbKJRurzcCFueLheRvu', '2024-04-19 19:08:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
