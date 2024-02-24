import os
import json

def get_file_list(directory):
    file_list = []
    for filename in os.listdir(directory):
        if os.path.isfile(os.path.join(directory, filename)):
            file_list.append(filename)
    return file_list

# Thư mục cần kiểm tra
folder_path = "C:/Users/Admin/Desktop/xoa"

# Lấy danh sách tên file
file_list = get_file_list(folder_path)

# In danh sách tên file dưới dạng JSON
file_list_json = json.dumps(file_list)
print(file_list_json)
