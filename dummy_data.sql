-- MySQL dump 10.15  Distrib 10.0.36-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: dummy_data
-- ------------------------------------------------------
-- Server version	10.0.36-MariaDB-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patients` (
  `Id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `ssn` varchar(9) DEFAULT NULL,
  `dob` varchar(255) DEFAULT NULL,
  `mrn` text,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES ('AHJ13','Blaine Wolfe','Kuwait','513748360','2018-12-27 23:24:08','123'),('AIB63','Blaine Wolfe','Turkmenistan','552778342','2019-07-04 17:04:03','456'),('ANS62','Samson Forbes','Sierra Leone','550599592','2019-06-15 17:55:33','123'),('ARH87','Kathleen Guerrero','Saint Lucia','552289249','2019-11-25 15:34:42','123'),('AUD47','Alvin Jenkins','Armenia','522137175','2019-08-13 10:19:39','123'),('BAG76','Dane Mack','Mozambique','541112544','2019-09-22 13:43:28','123'),('BBA86','Xander Finch','Lithuania','534693847','2018-05-22 14:07:47','123'),('BGL59','Steven Cohen','Zambia','526364746','2019-05-07 06:37:31','123'),('BOV87','Malcolm Barber','Dominica','513818511','2018-02-25 21:51:48','123'),('CHO99','Nelle Levy','Ireland','533781188','2019-04-03 07:57:34','123'),('COH40','Althea Jennings','Svalbard and Jan Mayen Islands','550689064','2018-02-06 10:50:21','123'),('CRZ54','Jamal Castillo','Kuwait','514207370','2018-11-01 01:24:13','123'),('DDY70','Calvin Kemp','Suriname','515557451','2018-04-29 15:38:01','123'),('DUP10','Destiny Potter','Moldova','547083339','2018-05-12 10:20:12','123'),('DYN51','Justina Huff','Panama','556975259','2018-01-21 14:05:33','123'),('ECF30','Gage Barlow','Mayotte','521622842','2018-10-08 03:47:34','123'),('EOO56','Maile Hunt','Greenland','537854229','2019-09-06 06:41:10','123'),('ERR83','Dolan Lloyd','Guyana','517937344','2019-06-27 20:59:27','123'),('EYL30','Marah Flores','Iraq','517590134','2019-02-18 12:51:15','123'),('FLH23','Jarrod Frank','Nigeria','517665358','2019-04-27 19:23:11','123'),('FTI77','Tobias Harris','Brunei','548476615','2019-08-23 14:00:29','123'),('FUI79','Keely Christensen','Belarus','522273789','2019-11-27 20:18:47','123'),('FVF81','Faith Garza','Bermuda','532341647','2018-05-25 08:29:17','123'),('GOP68','Tarik Wagner','France','535466089','2019-10-18 21:15:28','123'),('GRH18','Lane Moss','Sao Tome and Principe','548306884','2019-11-02 18:34:28','123'),('GSC37','Joy Mcknight','Nepal','556050197','2019-08-20 18:02:55','123'),('GSE61','Gabriel Burch','Kenya','558290723','2018-01-21 21:24:28','123'),('GXH13','Lara Dunlap','French Southern Territories','543761455','2018-06-03 21:50:02','123'),('HFF86','Madison Garcia','Rwanda','553986449','2019-07-18 10:51:24','123'),('HIM85','Merrill Stafford','Bulgaria','537958334','2019-05-01 09:27:05','123'),('HKL01','Brent Fulton','Switzerland','556337327','2018-10-25 08:37:36','123'),('HTB29','Lana Garza','Italy','526652609','2018-09-23 15:40:51','123'),('HUA37','Kevin Matthews','Isle of Man','517370088','2019-04-18 20:38:51','123'),('IDX20','Kalia Phillips','Lithuania','540317026','2018-06-06 16:18:00','123'),('IKE00','Ferdinand Hubbard','Fiji','521687360','2018-02-21 20:21:10','123'),('IMY59','Lynn Potts','Saint Lucia','511205136','2019-02-01 00:14:11','123'),('ISW99','Reuben Cleveland','Saint Barthélemy','520596833','2018-03-10 15:31:00','123'),('IUK34','Ira Delaney','Holy See (Vatican City State)','532220457','2019-07-25 09:11:26','123'),('IZV79','Hadassah Soto','Malawi','513255288','2019-04-01 06:12:00','123'),('JTU38','Zeus Hardy','Saint Barthélemy','514611447','2018-01-09 17:10:25','123'),('KMU95','Kadeem Waller','Gibraltar','520428599','2018-08-03 00:33:33','123'),('KSS86','Amal Kemp','Bulgaria','526001102','2019-05-24 02:04:47','123'),('KZY14','Charity Kennedy','Moldova','512610468','2018-11-20 01:31:00','123'),('LIM73','Jared Cain','Romania','541141194','2019-08-07 23:27:36','123'),('LNP88','Raya English','Zimbabwe','552687950','2018-08-09 23:30:01','123'),('LTM80','Adam Wolf','Serbia','546057204','2018-05-12 07:24:55','123'),('MAL10','Colin Alford','Azerbaijan','529368800','2018-02-18 19:38:27','123'),('MNS44','Noah Kramer','Saint Helena, Ascension and Tristan da Cunha','541853064','2018-12-23 20:10:02','123'),('MQK26','Troy Bradshaw','Iran','537452206','2018-08-10 16:02:21','123'),('MRN36','Selma Matthews','Korea, South','545534387','2019-12-06 10:24:52','123'),('MYL87','Holmes Arnold','Dominica','534225391','2019-03-20 06:15:34','123'),('NCJ26','Connor Conner','Netherlands','547207775','2018-02-07 06:29:54','123'),('NDV67','Joseph Castaneda','Malaysia','518827363','2018-10-10 06:45:54','123'),('NIV65','Madonna Ray','Bangladesh','550551003','2019-10-12 22:50:47','123'),('NKC67','Carson Clemons','Ethiopia','537868620','2019-10-19 20:06:49','123'),('NMY83','Ronan Munoz','Macao','552561952','2018-10-10 14:58:18','123'),('NQM58','Nero Scott','Montenegro','520307328','2019-06-26 07:34:10','123'),('OEJ42','Shelly Forbes','Sudan','552399335','2018-06-21 16:16:41','123'),('OEU47','George Mullen','Uzbekistan','521233431','2019-02-28 04:14:18','123'),('OVA80','Patricia Douglas','Mauritius','552831625','2019-08-08 06:42:56','123'),('PBJ55','Justin Ramsey','Malaysia','542085333','2019-01-29 01:46:19','123'),('PDH67','Omar Thompson','South Africa','533702588','2018-12-04 12:13:01','123'),('PFL66','Chaney Vega','Bouvet Island','541595265','2018-02-10 23:35:53','123'),('QCM46','Vance Osborn','Maldives','548011977','2019-04-30 02:05:52','123'),('QFH21','Alden Pierce','Palau','534111780','2018-10-24 07:27:49','123'),('QFT97','Astra Kline','Falkland Islands','546786511','2019-02-05 16:22:27','123'),('QKL96','Chelsea Ballard','Guyana','559372232','2018-04-15 00:15:09','123'),('QLU99','Jordan Burke','Romania','523153752','2018-02-15 12:17:59','123'),('QLV53','Cecilia Franklin','Antarctica','547806315','2019-11-30 03:11:33','123'),('QNB02','Ora Cain','United Kingdom (Great Britain)','526271072','2019-03-05 14:34:20','123'),('RGE96','Callie Wiley','Nigeria','535087390','2018-05-03 03:54:09','123'),('RGT27','Oleg Hansen','Tokelau','512478286','2018-05-10 06:31:27','123'),('RRK69','Tad Wagner','Guadeloupe','548408460','2019-07-10 11:19:09','123'),('SAO12','Ronan Montgomery','Ireland','548203582','2018-02-16 12:16:02','123'),('SBP70','Karina Hogan','Myanmar','533648959','2018-12-05 07:09:05','123'),('SFL14','Hamilton Weiss','United States','556966284','2018-09-01 20:14:34','123'),('SKO35','Kimberly Woodward','Saint Martin','547966901','2019-02-23 22:04:17','123'),('SMA05','Oscar Potts','Italy','511572280','2018-09-06 07:14:13','123'),('SUQ99','Paul Cummings','Peru','517457650','2018-12-24 13:25:17','123'),('THH94','Barrett West','Montenegro','552043275','2018-12-05 10:13:21','123'),('TMD63','Latifah Wright','Saint Barthélemy','540116892','2019-02-12 14:43:05','123'),('TQV68','Otto Vega','Jordan','516620842','2019-10-22 10:43:45','123'),('URX16','Upton Obrien','Macedonia','531692560','2018-05-29 09:42:09','123'),('UTH69','Solomon Davis','Panama','511800951','2019-03-07 14:28:24','123'),('UWM79','Libby Brady','Switzerland','531878196','2018-09-19 02:06:39','123'),('VHY19','Erin Gillespie','Germany','553899568','2019-09-26 14:37:38','123'),('VPL72','Charles Daniel','Anguilla','553201681','2017-12-29 05:16:38','123'),('VRP31','James Poole','Liberia','555256853','2018-03-30 04:19:47','123'),('WEW14','Kiara Rodriguez','Poland','543463366','2018-02-14 12:14:26','123'),('WLZ94','Conan Cantu','El Salvador','559775229','2018-08-23 09:12:20','123'),('XHP02','Declan Obrien','Argentina','548124069','2019-05-01 20:42:09','123'),('XYB73','Amaya Herring','Estonia','542111877','2019-09-29 20:51:11','123'),('YCC10','Morgan Mcintosh','Tuvalu','541022988','2018-02-01 12:55:33','123'),('YCR80','Rosalyn Chase','Nigeria','528191828','2019-04-19 16:02:02','123'),('YOC92','Brent Medina','Vanuatu','547569511','2019-06-09 10:54:35','123'),('YYM80','Chloe Harris','Tonga','515340822','2019-10-05 04:52:39','123'),('ZBO14','Dylan Whitehead','Philippines','550940186','2018-07-10 00:24:51','123'),('ZGT71','Basil Hurst','Cocos (Keeling) Islands','540717601','2018-02-08 15:50:21','123'),('ZIU48','Kameko Fulton','Guernsey','546161501','2019-10-29 13:44:00','123'),('ZUJ99','Tarik Barker','South Sudan','512662073','2019-02-24 03:55:44','123');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-12-23  2:28:42
