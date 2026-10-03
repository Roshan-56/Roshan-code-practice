export const languages = [
 {id:'python',name:'Python 3',ext:'py',starter:'def solve():\n    # TODO: adapt the signature to the problem.\n    pass\n'},
 {id:'c',name:'C',ext:'c',starter:'#include <stdio.h>\n\n// TODO: define the required function and input types.\nint main(void) {\n    return 0;\n}\n'},
 {id:'cpp',name:'C++',ext:'cpp',starter:'#include <bits/stdc++.h>\nusing namespace std;\n\n// TODO: implement the required function.\nint main() { return 0; }\n'},
 {id:'java',name:'Java',ext:'java',starter:'class Solution {\n    // TODO: define and implement the required method.\n}\n'},
 {id:'javascript',name:'JavaScript',ext:'js',starter:'function solve(input) {\n    // TODO: implement your approach.\n}\n'},
 {id:'typescript',name:'TypeScript',ext:'ts',starter:'function solve(input: unknown): unknown {\n    // TODO: replace the types and implement your approach.\n    return undefined;\n}\n'},
 {id:'go',name:'Go',ext:'go',starter:'package main\n\nfunc main() {\n    // TODO: implement the required function.\n}\n'},
 {id:'rust',name:'Rust',ext:'rs',starter:'fn main() {\n    // TODO: implement the required function.\n}\n'},
 {id:'csharp',name:'C#',ext:'cs',starter:'public class Solution {\n    // TODO: implement the required method.\n}\n'},
 {id:'kotlin',name:'Kotlin',ext:'kt',starter:'class Solution {\n    // TODO: implement the required method.\n}\n'},
 {id:'swift',name:'Swift',ext:'swift',starter:'class Solution {\n    // TODO: implement the required method.\n}\n'},
 {id:'php',name:'PHP',ext:'php',starter:'<?php\nfunction solve($input) {\n    // TODO: implement your approach.\n}\n'},
 {id:'ruby',name:'Ruby',ext:'rb',starter:'def solve(input)\n  # TODO: implement your approach.\nend\n'},
 {id:'sql',name:'SQL',ext:'sql',starter:'-- TODO: read the schema and write the required query.\n'},
 {id:'scala',name:'Scala',ext:'scala',starter:'object Solution {\n  // TODO: implement the required method.\n}\n'},
 {id:'dart',name:'Dart',ext:'dart',starter:'void main() {\n  // TODO: implement the required function.\n}\n'},
 {id:'r',name:'R',ext:'r',starter:'solve <- function(input) {\n  # TODO: implement your approach.\n}\n'}
] as const;
export type Language = typeof languages[number]['id'];
export const languageInfo = (id:Language) => languages.find(l=>l.id===id)!;
