import time
import tempfile
import shutil
import random
import pandas as pd
from pathlib import Path
from tkinter import Tk, filedialog
from urllib.parse import quote_plus

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    InvalidSessionIdException,
    WebDriverException,
    TimeoutException
)

# =========================
# AYARLAR
# =========================

BASLANGIC_BEKLEME = 3
SAYFA_BEKLEME_MIN = 2.0
SAYFA_BEKLEME_MAX = 4.5

# Gerçek bir CAPTCHA çıkarsa senin manuel çözebilmen için bekleme süresi
GOOGLE_SONUC_BEKLEME = 15 
PAGE_LOAD_TIMEOUT = 18
SCRIPT_TIMEOUT = 10

MAX_RESTART = 10


def yaz(metin):
    print(metin, flush=True)


def masaustu_chrome_klasoru():
    klasor = Path.home() / "Desktop" / "chrome"
    klasor.mkdir(parents=True, exist_ok=True)
    return klasor


def chrome_baslat():
    user_data_dir = tempfile.mkdtemp(prefix="chrome_profile_")

    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument("--remote-debugging-port=9220")

    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument("--disable-dev-shm-usage")

    options.add_argument("--window-position=0,0")
    options.add_argument("--window-size=1024,900")

    driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    driver.set_script_timeout(SCRIPT_TIMEOUT)

    wait = WebDriverWait(driver, GOOGLE_SONUC_BEKLEME)

    return driver, wait, user_data_dir


def chrome_kapat(driver, user_data_dir):
    try:
        if driver:
            driver.quit()
    except Exception:
        pass

    try:
        if user_data_dir:
            shutil.rmtree(user_data_dir, ignore_errors=True)
    except Exception:
        pass


def google_ac(driver, url):
    try:
        driver.get(url)
        return True
    except TimeoutException:
        yaz("[Chrome] Sayfa yükleme uzadı, durduruluyor...")
        try:
            driver.execute_script("window.stop();")
        except Exception:
            pass
        return True
    except WebDriverException:
        raise


def ilk_sonucu_bul(driver, wait, firma):
    arama_url = "https://www.google.com/search?q=" + quote_plus(firma)

    google_ac(driver, arama_url)
    time.sleep(random.uniform(SAYFA_BEKLEME_MIN, SAYFA_BEKLEME_MAX))

    selectors = [
        "div.yuRUbf a",
        "div#search a[href^='http']",
        "a[jsname][href^='http']"
    ]

    for selector in selectors:
        try:
            sonuc = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )

            url = sonuc.get_attribute("href")

            if url and url.startswith("http"):
                return url

        except TimeoutException:
            continue
        except WebDriverException:
            raise

    return "Bulunamadı veya Hata"


def ara_kayit_csv_yaz(csv_dosyasi, index, firma, url):
    satir = pd.DataFrame([{
        "Index": index,
        "Firma": firma,
        "Website": url
    }])

    if csv_dosyasi.exists():
        satir.to_csv(
            csv_dosyasi,
            mode="a",
            header=False,
            index=False,
            encoding="utf-8-sig"
        )
    else:
        satir.to_csv(
            csv_dosyasi,
            mode="w",
            header=True,
            index=False,
            encoding="utf-8-sig"
        )


def tamamlanan_indexleri_oku(csv_dosyasi):
    if not csv_dosyasi.exists():
        return set()

    try:
        df = pd.read_csv(csv_dosyasi)

        if "Index" not in df.columns:
            return set()

        return set(df["Index"].astype(int).tolist())

    except Exception:
        return set()


def chrome_dongusu(firma_listesi, chrome_klasoru):
    csv_dosyasi = chrome_klasoru / "ara_kayit.csv"

    tamamlananlar = tamamlanan_indexleri_oku(csv_dosyasi)

    driver = None
    wait = None
    user_data_dir = None
    restart_sayisi = 0

    try:
        yaz("[Chrome] Başlatılıyor...")

        try:
            driver, wait, user_data_dir = chrome_baslat()
        except Exception as e:
            yaz(f"[Chrome] AÇILAMADI: {e}")
            return False

        yaz(f"[Chrome] Açıldı. {BASLANGIC_BEKLEME} saniye bekleniyor...")
        time.sleep(BASLANGIC_BEKLEME)

        toplam = len(firma_listesi)
        yaz(f"[Chrome] Listede {toplam} firma var. Arama başlıyor.")

        sira = 0

        while sira < toplam:
            index, firma = firma_listesi[sira]
            firma = str(firma).strip()

            if index in tamamlananlar:
                sira += 1
                continue

            try:
                if firma == "" or firma.lower() == "nan":
                    ara_kayit_csv_yaz(csv_dosyasi, index, firma, "")
                    tamamlananlar.add(index)
                    sira += 1
                    continue

                url = ilk_sonucu_bul(driver, wait, firma)

                ara_kayit_csv_yaz(csv_dosyasi, index, firma, url)
                tamamlananlar.add(index)

                yaz(f"[Chrome] {sira + 1}/{toplam} - {firma} -> {url}")

                sira += 1

            except (InvalidSessionIdException, WebDriverException):
                restart_sayisi += 1

                yaz("[Chrome] Chrome bağlantısı koptu / dondu. Yeniden başlatılıyor...")
                yaz(f"[Chrome] Aynı firmadan devam edilecek: {firma}")

                chrome_kapat(driver, user_data_dir)

                if restart_sayisi > MAX_RESTART:
                    yaz("[Chrome] Çok fazla yeniden başlatma oldu. İşlem durduruldu.")
                    break

                time.sleep(6)

                try:
                    driver, wait, user_data_dir = chrome_baslat()
                    time.sleep(BASLANGIC_BEKLEME)
                except Exception as e2:
                    yaz(f"[Chrome] Yeniden başlatılamadı: {e2}")
                    break

            except Exception as e:
                ara_kayit_csv_yaz(csv_dosyasi, index, firma, "Bulunamadı veya Hata")
                tamamlananlar.add(index)

                yaz(f"[Chrome] {sira + 1}/{toplam} - HATA: {firma} - {str(e)[:80]}")

                sira += 1

    finally:
        chrome_kapat(driver, user_data_dir)

    return True


def csv_ara_kayitlari_excel_ile_birlestir(df, chrome_klasoru):
    df["Website"] = ""
    csv_dosyasi = chrome_klasoru / "ara_kayit.csv"

    if not csv_dosyasi.exists():
        return df

    try:
        ara_df = pd.read_csv(csv_dosyasi)
        ara_df = ara_df.drop_duplicates(subset=["Index"], keep="last")

        for _, row in ara_df.iterrows():
            index = int(row["Index"])
            website = row["Website"]
            df.at[index, "Website"] = website

    except Exception as e:
        yaz(f"CSV birleştirme hatası: {e}")

    return df


def main():
    Tk().withdraw()

    dosya_yolu = filedialog.askopenfilename(
        title="Excel dosyasını seç",
        filetypes=[("Excel Dosyaları", "*.xlsx *.xls")]
    )

    if not dosya_yolu:
        print("Dosya seçilmedi.")
        return

    df = pd.read_excel(dosya_yolu)

    if df.empty:
        print("Excel dosyası boş.")
        return

    firma_sutunu = df.columns[0]
    chrome_klasoru = masaustu_chrome_klasoru()
    firma_listesi = []

    for index, row in df.iterrows():
        firma = str(row[firma_sutunu]).strip()
        firma_listesi.append((index, firma))

    print(f"Toplam firma: {len(firma_listesi)}")
    print(f"Ara kayıt klasörü: {chrome_klasoru}")
    print("Not: Daha önce bulunan kayıtlar varsa atlanacak, işlem kaldığı yerden devam edecek.")
    print("-" * 50)

    # Ana arama döngüsünü başlat
    chrome_dongusu(firma_listesi, chrome_klasoru)

    # Sonuçları orijinal Excel dosyasıyla birleştir ve kaydet
    final_df = csv_ara_kayitlari_excel_ile_birlestir(df, chrome_klasoru)

    final_dosya = chrome_klasoru / "firmalar_ve_websiteleri_final.xlsx"
    final_df.to_excel(final_dosya, index=False)

    print("\n" + "=" * 50)
    print("İşlem tamamlandı.")
    print(f"Final Excel dosyası: {final_dosya}")
    print("Ara kayıt CSV dosyası aynı klasörde duruyor.")


if __name__ == "__main__":
    main()
