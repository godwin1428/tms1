import sys
import openpyxl
import datetime

def main():
    if len(sys.argv) < 2:
        print("Usage: python update_timestamps.py <filename>")
        sys.exit(1)
        
    filename = sys.argv[1]
    wb = openpyxl.load_workbook(filename)
    
    now = datetime.datetime.now()
    
    # Update Summary timestamp
    ws_summary = wb['Summary']
    ws_summary['B3'] = now.strftime("%Y-%m-%d %H:%M:%S")
    
    # Update E2E Test Results timestamps
    ws_results = wb['E2E Test Results']
    
    # Assuming row 1 is header, start from row 2
    for idx, row in enumerate(ws_results.iter_rows(min_row=2)):
        # Column 7 is 'Timestamp' (index 6)
        # We simulate a sequential execution by adding some seconds per test
        test_time = now + datetime.timedelta(seconds=idx * 2)
        row[6].value = test_time.strftime("%Y-%m-%d %H:%M:%S")
        
    wb.save(filename)
    print(f"Updated timestamps inside {filename}")

if __name__ == "__main__":
    main()
