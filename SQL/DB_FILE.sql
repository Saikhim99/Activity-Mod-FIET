-- ==========================================
-- สร้างฐานข้อมูล Activity Mod FIET
-- ==========================================

-- 1. สร้าง Database
CREATE DATABASE [Activity Mod FIET];
GO

USE [Activity Mod FIET];
GO

-- 2. สร้างตาราง User หลัก
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

-- 3. สร้างตาราง StudentUser
CREATE TABLE dbo.StudentUser (
    UserID         INT           PRIMARY KEY,
    ThaiFirstName  NVARCHAR(300) NULL,
    ThaiLastName   NVARCHAR(300) NULL,
    School         NVARCHAR(100) NULL,
    CONSTRAINT FK_StudentUser_User FOREIGN KEY (UserID) REFERENCES dbo.[User](ID)
);
GO

-- 4. สร้างตาราง TeacherUser
CREATE TABLE dbo.TeacherUser (
    UserID     INT           PRIMARY KEY,
    FirstName  NVARCHAR(300) NULL,
    LastName   NVARCHAR(300) NULL,
    Major      NVARCHAR(100) NULL,
    CONSTRAINT FK_TeacherUser_User FOREIGN KEY (UserID) REFERENCES dbo.[User](ID)
);
GO

USE [Activity Mod FIET];
GO

-- เพิ่มบัญชีครู (is_verified = 1 = เข้าใช้ได้เลย)
INSERT INTO dbo.[User] (username, password, role, is_verified, email)
VALUES ('teacher01', 'P@sswOrd', 'teacher', 1, 'teacher01@example.com');

INSERT INTO dbo.TeacherUser (UserID, FirstName, LastName, Major)
VALUES (SCOPE_IDENTITY(), N'สมชาย', N'ใจดี', N'วิศวกรรมไฟฟ้า');
GO

-- เพิ่มบัญชีนักเรียน
INSERT INTO dbo.[User] (username, password, role, is_verified, email)
VALUES ('student01', 'P@sswOrd', 'student', 1, 'student01@example.com');

INSERT INTO dbo.StudentUser (UserID, ThaiFirstName, ThaiLastName, School)
VALUES (SCOPE_IDENTITY(), N'สมหญิง', N'รักเรียน', N'โรงเรียนตัวอย่าง');
GO

USE [Activity Mod FIET];
GO

SELECT * FROM dbo.[User];
SELECT * FROM dbo.StudentUser;
SELECT * FROM dbo.TeacherUser;
GO

USE [Activity Mod FIET];
GO

-- เพิ่มเฉพาะคอลัมน์ที่ยังไม่มี
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.StudentUser') AND name = 'EngFirstName')
    ALTER TABLE dbo.StudentUser ADD EngFirstName NVARCHAR(300) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.StudentUser') AND name = 'EngLastName')
    ALTER TABLE dbo.StudentUser ADD EngLastName NVARCHAR(300) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.StudentUser') AND name = 'Birthday')
    ALTER TABLE dbo.StudentUser ADD Birthday DATE NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.StudentUser') AND name = 'Telephone')
    ALTER TABLE dbo.StudentUser ADD Telephone NVARCHAR(20) NULL;
GO
