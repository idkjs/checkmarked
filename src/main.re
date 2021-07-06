let out_dir = "__checkmarked__";
let config = Config.read();

let rec ensureDirExists = path => {
  let dir = BsNode.Node.Path.dirname(path);
  if ((!) @@ BsNode.Node.Fs.existsSync(dir)) {
    ensureDirExists(dir);
    BsNode.Node.Fs.mkdirSync(dir);
  };
};

let writeFile = (filename, content) => {
  let path = BsNode.Node.Path.join([|out_dir, filename|]);
  ensureDirExists(path);
  BsNode.Node.Fs.writeFileSync(~filename=path, ~text=content);
};

let ruleFor = lang => Js.Dict.get(Config.(config.rules), lang);

let checkCode = (filename, rule: Config.rule) =>
  rule.tasks
  |> List.iter(task_spec =>
       switch (Js.Dict.get(config.tasks, task_spec.Config.name)) {
       | Some(task) =>
         let cmd =
           task.command
           |> Js.String.replaceByRe([%re {|/\$\(file\)/|}], filename);
         let cmd =
           switch (task_spec.arguments) {
           | Some(args) =>
             cmd |> Js.String.replaceByRe([%re {|/\$\(args\)/|}], args)
           | None => cmd
           };

         Js.log(cmd);
         let _: string =
           BsNode.Node.ChildProcess.execSync(
             cmd,
             BsNode.Node.Options.options(~cwd=out_dir, ()),
           );
         print_endline("done");
       | None => print_endline("Task not found: " ++ task_spec.name)
       }
     );

let checkFile = path => {
  print_endline({j|Parsing $path... |j});
  BsNode.Node.Fs.readFileAsUtf8Sync(path)
  |> Extract.extract
  |> Array.to_list
  |> List.iteri((i, (lang, content)) =>
       switch (ruleFor(lang)) {
       | Some(rule) =>
         let extension = Js.Option.(rule.extension |> getWithDefault(lang));
         let target_file = {j|$path.$i.$extension|j};

         writeFile(target_file, content);

         print_string @@ "Checking " ++ target_file ++ "... ";
         checkCode(target_file, rule);

       | None => print_endline("No rule for language: " ++ lang)
       }
     );
  print_endline("");
};

let _ =
  config.sources
  |> List.map(pattern => pattern |> Glob.sync |> Array.to_list)
  |> List.flatten
  |> List.map(checkFile);
