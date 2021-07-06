
# checkmarked

WIP, currently a very quick and dirty proof-of-concept



type t
external parseArgs : string array -> t = "minimist" "BS:external"
external get : t -> string -> string option = "" "BS:external"
external orphans : t -> string array = "_" "BS:external"
