# Batch Test

## Downloading zips
We test the generator under realistic conditions via the batch-execution.js pupeter script.
It shoots given ecores against the generator (assumed to run under http://localhost:4200), chooses in the dialogs it provides or uses an existing choice config, and stores the zipped initial editors under `.out`.

## Unpacking, installing and building
In order to test, if the generated code works out of the box, we need more tests.
Each editor should be unpacked, have its npm dependencies installed, and be built.

