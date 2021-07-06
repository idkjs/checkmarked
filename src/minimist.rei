type t;

[@bs.module] external parseArgs: array(string) => t = "minimist";

[@bs.get_index] [@bs.return {undefined_to_opt: undefined_to_opt}]
external get: (t, string) => option(string);
[@bs.get] external orphans: t => array(string) = "_";
