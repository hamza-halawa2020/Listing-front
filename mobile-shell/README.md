# Mobile Shell

This folder wraps the existing Angular web app with Capacitor without changing the Angular source code.

## متطلبات التشغيل

- Node.js و npm
- Android Studio
- Java JDK 17 أو أحدث
- Gradle

## الإعداد الأولي

1. انتقل لمجلد mobile-shell:
```cmd
cd mobile-shell
```

2. تثبيت المكتبات:
```cmd
npm install
```

3. إضافة منصة Android:
```cmd
npm run add:android
```

4. توليد أيقونات وشاشات البداية:
```cmd
npm run brand:android
```

5. مزامنة المشروع:
```cmd
npm run sync:android
```

6. فتح Android Studio:
```cmd
npm run open:android
```

## التطوير اليومي

### تشغيل التطبيق على الموبايل/المحاكي:
```cmd
npm run run:android
```

### مزامنة التغييرات من الويب:
```cmd
npm run sync:android
```
هذا الأمر يقوم بـ:
- بناء مشروع Angular من المجلد الأساسي
- نسخ الملفات إلى مجلد Android

## بناء نسخة Release

### الخطوة 1: إعداد Keystore (مرة واحدة فقط)

1. انسخ ملف الإعدادات:
```cmd
copy android\keystore.properties.example android\keystore.properties
```

2. توليد keystore جديد:
```cmd
cd android\app
keytool -genkeypair -v -keystore release.keystore -alias careandshare-upload -keyalg RSA -keysize 2048 -validity 10000
```

3. افتح ملف `android/keystore.properties` وضع البيانات الصحيحة:
```properties
storePassword=كلمة_السر_اللي_حطيتها
keyPassword=كلمة_السر_اللي_حطيتها
keyAlias=careandshare-upload
storeFile=app/release.keystore
```

### الخطوة 2: بناء التطبيق

#### بناء APK (للتوزيع المباشر):
```cmd
npm run build:release:apk
```
الملف هيطلع في: `android/app/build/outputs/apk/release/app-release.apk`

#### بناء AAB (للرفع على Google Play Store):
```cmd
npm run build:release:aab
```
الملف هيطلع في: `android/app/build/outputs/bundle/release/app-release.aab`

## الخطوات الكاملة لبناء Release من الصفر

```cmd
# 1. الانتقال للمجلد
cd mobile-shell

# 2. بناء مشروع الويب
npm run build:web

# 3. توليد الأيقونات والشاشات
npm run brand:android

# 4. مزامنة مع Android
npm run sync:android

# 5. بناء APK
npm run build:release:apk
```

## الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `npm run build:web` | بناء مشروع Angular |
| `npm run brand:android` | توليد أيقونات وشاشات البداية |
| `npm run sync:android` | بناء الويب ومزامنة مع Android |
| `npm run open:android` | فتح المشروع في Android Studio |
| `npm run run:android` | تشغيل التطبيق على الموبايل/المحاكي |
| `npm run build:release:apk` | بناء APK موقع للإصدار |
| `npm run build:release:aab` | بناء AAB موقع للإصدار |

## ملاحظات مهمة

- تأكد من تحديث `capacitor.config.ts` بالإعدادات الصحيحة
- الـ keystore مهم جداً - احتفظ بنسخة احتياطية منه
- لو فقدت الـ keystore، مش هتقدر تعمل update للتطبيق على Play Store
- الـ AAB هو الصيغة المطلوبة للرفع على Google Play Store
- الـ APK للتوزيع المباشر أو الاختبار

## استكشاف الأخطاء

### مشكلة في Gradle:
```cmd
cd android
gradlew clean
cd ..
npm run sync:android
```

### مشكلة في الـ cache:
```cmd
cd android
gradlew clean
rmdir /s /q .gradle
cd ..
```

### تحديث Capacitor:
```cmd
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
npx cap sync
```
