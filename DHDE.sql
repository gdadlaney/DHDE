-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 25, 2019 at 02:58 PM
-- Server version: 5.7.25-0ubuntu0.16.04.2
-- PHP Version: 7.0.33-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `DHDE`
--

-- --------------------------------------------------------

--
-- Table structure for table `DNS`
--

CREATE TABLE `DNS` (
  `Clinic_Id` varchar(255) NOT NULL,
  `Clinic_IP` varchar(255) NOT NULL,
  `Clinic_Name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `DNS`
--

INSERT INTO `DNS` (`Clinic_Id`, `Clinic_IP`, `Clinic_Name`) VALUES
('CHO', '127.0.0.3', 'Care Hospital'),
('PHO', '127.0.0.2', 'Poona Hospital'),
('RNH', '127.0.0.4', 'Rao Nursing Home'),
('SHO', '127.0.0.1', 'Sasoon Hospital');

-- --------------------------------------------------------

--
-- Table structure for table `EMPI`
--

CREATE TABLE `EMPI` (
  `Id` varchar(255) NOT NULL,
  `FirstName` text NOT NULL,
  `LastName` text NOT NULL,
  `Country` text NOT NULL,
  `SSN` varchar(9) NOT NULL,
  `DoB` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `EMPI`
--

INSERT INTO `EMPI` (`Id`, `FirstName`, `LastName`, `Country`, `SSN`, `DoB`) VALUES
('AH19', 'Adam', 'Hamilton', 'US', '741852963', '1990-08-19'),
('AK47', 'Aditya', 'Kabra', 'India', '741852789', '1997-05-01'),
('AP49', 'Anuj', 'Pahade', 'India', '852963741', '1997-12-25'),
('AR48', 'Aniruddha', 'Rajnekar', 'India', '231654789', '1996-07-30'),
('GD50', 'Gaurav', 'Dadlaney', 'India', '852654123', '1997-11-18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `DNS`
--
ALTER TABLE `DNS`
  ADD PRIMARY KEY (`Clinic_Id`);

--
-- Indexes for table `EMPI`
--
ALTER TABLE `EMPI`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `SSN` (`SSN`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
