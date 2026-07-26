package org.example;

import java.io.*;
import java.util.Scanner;


public class LogSplit {

private static final int PARTS_COUNT = 5;

    public static void main(String[] args){

        Scanner scanner = new Scanner(System.in);
        if (args.length == 1 && args[0].equals("--help")) {
            System.out.println("Использование программы:");
            System.out.println("java -jar log_split.jar <путь_к_исходному_файлу> <путь_к_папке_для_результата>");
            System.out.println();
            System.out.println("Программа разбивает один большой лог-файл на несколько частей.");
            System.out.println();
            System.out.println("Параметры:");
            System.out.println("1. Путь к исходному файлу — полный путь к лог-файлу, который нужно разделить.");
            System.out.println("2. Путь к папке для результата — папка, куда будут сохранены части файла.");
            System.out.println();
            System.out.println("Пример:");
            System.out.println("java -jar log_split.jar C:\\logs\\app.log C:\\logs\\parts");
            return;
        }

        String intputPath;
        String outputPath;

        if (args.length >= 2){
            intputPath = args[0];
            outputPath = args[1];
        }else{
            System.out.println("Напишите полный путь до лог-файла:");
            intputPath = scanner.nextLine();


            System.out.println("Напишите полный путь до папки и постоянное составное имя файлов где будут храниться логи:");
            outputPath = scanner.nextLine();
        }

        File inputFile = new File(intputPath);
        if (!inputFile.exists()){
            System.out.println("Фаил не найден");
            return;
        }
        if (!inputFile.isFile()){
            System.out.println("Указный путь не содержит фаил");
            return;
        }

        File outputFile = new File(outputPath);
        File outputDirectory = outputFile.getParentFile();
        if (outputDirectory != null && !outputDirectory.exists()){
            outputDirectory.mkdirs();
        }

        int totalLine = 0;

        try(
                BufferedReader reader = new BufferedReader(new FileReader(inputFile))

        ) {
            while(reader.readLine() != null){
                totalLine ++;
            }

        }catch (IOException e){
            System.out.println("ERROR: ошибка чтения файла" + e.getMessage());
            return;
        }

        System.out.println("Количество строк в файле: " + totalLine);

        int linesPerFile = (int) Math.ceil((double) totalLine / PARTS_COUNT);
        System.out.println("Строк в каждом файле примерно: " + linesPerFile);

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFile))) {

            for (int fileNumber = 1; fileNumber <= PARTS_COUNT; fileNumber++) {
                String firstLine = reader.readLine();
                if (firstLine == null) {
                    break;
                }


                String fileName = outputPath + "_" + fileNumber + ".log";

                try (BufferedWriter writer =
                             new BufferedWriter(new FileWriter(fileName))) {

                    String line;
                    int writtenLines = 0;

                    while (writtenLines < linesPerFile
                            && (line = reader.readLine()) != null) {

                        writer.write(line);
                        writer.newLine();
                        writtenLines++;
                    }
                }

                System.out.println("Создан файл: " + fileName);
            }

        } catch (IOException e) {
            System.out.println("Ошибка при работе с файлами: " + e.getMessage());
        }
        System.out.println("Разбиение файла на части окончено. Количество созданных частей: " + PARTS_COUNT);




    }

}
