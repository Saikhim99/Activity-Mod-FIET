-- ==========================================
--  Activity Mod FIET Database Script
-- ==========================================

-- หากต้องการรันสคริปต์นี้เพื่อลบฐานข้อมูลเก่าและสร้างใหม่ทั้งหมด 
-- สามารถเอาคอมเมนต์ (--) 5 บรรทัดด้านล่างนี้ออกได้เลยครับ
-- USE master;
-- GO
-- IF EXISTS (SELECT * FROM sys.databases WHERE name = 'Activity Mod FIET')
-- BEGIN
--     ALTER DATABASE [Activity Mod FIET] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
--     DROP DATABASE [Activity Mod FIET];
-- END
-- GO

-- 1. สร้าง Database
CREATE DATABASE [Activity Mod FIET];
GO

USE [Activity Mod FIET];
GO

-- 2. ตาราง User หลัก
CREATE TABLE dbo.[User] (
    ID          INT IDENTITY(1,1) PRIMARY KEY,
    username    NVARCHAR(100)    NOT NULL,
    password    NVARCHAR(100)    NULL,
    role        NVARCHAR(50)     NOT NULL,
    is_verified BIT              NOT NULL DEFAULT 0,
    email       NVARCHAR(255)    NULL,
    otp_code    NVARCHAR(10)     NULL,
    otp_expiry  DATETIME         NULL
);
GO

-- 3. ตาราง StudentUser (รวมคอลัมน์ทั้งหมดครบถ้วนแต่แรกเกิด)
CREATE TABLE dbo.StudentUser (
    UserID         INT           PRIMARY KEY,
    ThaiFirstName  NVARCHAR(300) NULL,
    ThaiLastName   NVARCHAR(300) NULL,
    EngFirstName   NVARCHAR(300) NULL,
    EngLastName    NVARCHAR(300) NULL,
    School         NVARCHAR(100) NULL,
    Birthday       DATE          NULL,
    Telephone      NVARCHAR(20)  NULL,
    CONSTRAINT FK_StudentUser_User FOREIGN KEY (UserID) REFERENCES dbo.[User](ID)
);
GO

-- 4. ตาราง TeacherUser (รวมคอลัมน์ทั้งหมดครบถ้วนแต่แรกเกิด)
CREATE TABLE dbo.TeacherUser (
    UserID         INT           PRIMARY KEY,
    FirstName      NVARCHAR(300) NULL,
    LastName       NVARCHAR(300) NULL,
    Major          NVARCHAR(100) NULL,
    Email          NVARCHAR(255) NULL,
    Telephone      NVARCHAR(20)  NULL,
    Birthday       NVARCHAR(100) NULL,
    ProfilePicture NVARCHAR(MAX) NULL,
    CONSTRAINT FK_TeacherUser_User FOREIGN KEY (UserID) REFERENCES dbo.[User](ID)
);
GO

-- 5. ตาราง TAUser (รวมคอลัมน์ทั้งหมดครบถ้วนแต่แรกเกิด)
CREATE TABLE dbo.TAUser (
    UserID         INT           PRIMARY KEY,
    FirstName      NVARCHAR(300) NULL,
    LastName       NVARCHAR(300) NULL,
    Major          NVARCHAR(100) NULL,
    Email          NVARCHAR(255) NULL,
    Telephone      NVARCHAR(20)  NULL,
    Birthday       NVARCHAR(100) NULL,
    ProfilePicture NVARCHAR(MAX) NULL,
    CONSTRAINT FK_TAUser_User FOREIGN KEY (UserID) REFERENCES dbo.[User](ID)
);
GO

-- ==========================================
-- Insert Mock Data (ใส่ข้อมูลทดสอบ)
-- ==========================================

-- ข้อมูลบัญชีครู (is_verified = 1 = ตรวจสอบแล้ว)
INSERT INTO dbo.[User] (username, password, role, is_verified, email)
VALUES ('teacher01', 'P@sswOrd', 'teacher', 1, 'teacher01@example.com');

INSERT INTO dbo.TeacherUser (UserID, FirstName, LastName, Major)
VALUES (SCOPE_IDENTITY(), N'สมศักดิ์', N'ใจดี', N'วิศวกรรมไฟฟ้า');
GO

-- ข้อมูลบัญชีนักเรียน
INSERT INTO dbo.[User] (username, password, role, is_verified, email)
VALUES ('student01', 'P@sswOrd', 'student', 1, 'student01@example.com');

INSERT INTO dbo.StudentUser (UserID, ThaiFirstName, ThaiLastName, School)
VALUES (SCOPE_IDENTITY(), N'สมหญิง', N'นักเรียน', N'โรงเรียนตัวอย่าง');
GO

-- ข้อมูลบัญชี TA
INSERT INTO dbo.[User] (username, password, role, is_verified, email)
VALUES ('ta01', 'P@sswOrd', 'ta', 1, 'ta01@example.com');

INSERT INTO dbo.TAUser (UserID, FirstName, LastName, Major)
VALUES (SCOPE_IDENTITY(), N'ผู้ช่วย', N'สอนเก่ง', N'วิศวกรรมคอมพิวเตอร์');
GO

-- ==========================================
-- Check Data
-- ==========================================
SELECT * FROM dbo.[User];
SELECT * FROM dbo.StudentUser;
SELECT * FROM dbo.TeacherUser;
SELECT * FROM dbo.TAUser;
GO
