//文件路径是在/storage/emulated/0/Android/data/org.autojs.autojs6/files/替换
//之前创建的backups文件夹和updates_temp文件夹删除不掉，而且也在里面新建不了文件，影响备份，手动删除也删除不了
//所以只能用shell命令删除
//现在更改了文件夹创建方法
文件夹名称=("替换")

let appExternalDir = context.getExternalFilesDir(null).getAbsolutePath();
a = files.join(appExternalDir, 文件夹名称);
log(a)

// shell("su -c 'rm -rf " + a + "'", true);  
shell("rm -rf " + a);