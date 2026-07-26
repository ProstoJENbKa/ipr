package org.example;

import java.io.*;
import java.util.Scanner;
import java.util.regex.Pattern;

public class LogSearch {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        if (args.length == 1 && args[0].equals("--help")) {
            System.out.println("Использование программы:");
            System.out.println("java -jar log-search.jar <регулярное_выражение> <путь_к_логам> <имя_выходного_файла> <папка_для_сохранения>");
            System.out.println();
            System.out.println("Или можно просто запустить программу через java -jar log-search.jar и следовать инструкциям ");
            System.out.println();
            System.out.println("Программа ищет строки по регулярному выражению");
            System.out.println("в одном лог-файле или во всех файлах указанной папки.");
            System.out.println("Найденные строки записываются в новый файл.");
            System.out.println();
            System.out.println("Пример:");
            System.out.println("java -jar log-search.jar \"ERROR|WARN\" C:\\logs result.log C:\\result");

            return;
        }

        String searchPattern;
        String logPath;
        String outputFileName;
        String outputPath;


        if (args.length >= 4) {
            searchPattern = args[0];
            logPath = args[1];
            outputFileName = args[2];
            outputPath = args[3];
        } else {
            System.out.println("Введите регулярное выражение для поиска:");
            searchPattern = scanner.nextLine();

            System.out.println("Введите путь к лог-файлу или папке:");
            logPath = scanner.nextLine();


            System.out.println("Введите имя нового файла:");
            outputFileName = scanner.nextLine();

            System.out.println("Введите путь куда сохранить результат работы программы:");
            outputPath = scanner.nextLine();
        }
        

        File logFile = new File(logPath);

        if (!logFile.exists()) {
            System.out.println("Ошибка: указанный путь не существует.");
            return;
        }

        if (logFile.isFile()) {
            System.out.println("Выбран один лог-файл.");
        } else if (logFile.isDirectory()) {
            System.out.println("Выбрана папка с логами.");
        } else {
            System.out.println("Ошибка: указан некорректный путь.");
            return;
        }

        File[] files;

        if (logFile.isFile()) {
            files = new File[]{logFile};
        } else {
            files = logFile.listFiles();
        }

        if (files == null || files.length == 0) {
            System.out.println("В указанной папке нет файлов.");
            return;
        }

        Pattern pattern = Pattern.compile(searchPattern);

        File outputFile = new File(outputPath, outputFileName);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {

            for (File file : files) {
                if (file.isFile()) {
                    try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                        String line;

                        while ((line = reader.readLine()) != null) {
                            if (pattern.matcher(line).find()) {
                                writer.write(line);
                                writer.newLine();
                            }
                        }

                    } catch (IOException e) {
                        System.out.println("Ошибка чтения файла " + file.getName() + ": " + e.getMessage());
                    }
                }
            }

        } catch (IOException e) {
            System.out.println("Ошибка создания выходного файла: " + e.getMessage());
        }




    }
}