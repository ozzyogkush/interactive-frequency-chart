#!/usr/bin/python3
"""Extract text (e.g. HTML pages) from HAR file

First, save a HAR file using OWASP ZAP (tested) or Firefox. Then

	har-extract-text.py tero.har

Copyright 2023 Tero Karvinen http://TeroKarvinen.com . GNU General Public License, version 3.
"""
__copyright__ = "Copyright 2023 Tero Karvinen http://TeroKarvinen.com"

import sys
assert sys.version_info.major >= 3
import os

import logging
from logging import info, debug, error, warning, INFO, WARNING, DEBUG
import argparse
import json
import re

def parseArgs():
	parser = argparse.ArgumentParser(fromfile_prefix_chars="@",
		formatter_class=argparse.RawDescriptionHelpFormatter,
		description=__doc__, epilog=__copyright__)
	parser.add_argument("-v", "--verbose", action="store_const", dest="log_level", const=INFO, default=INFO)
	parser.add_argument("-d", "--debug", action="store_const", dest="log_level", const=DEBUG)

	parser.add_argument("-m", "--match", default=r"\.html?$", help="Only extracts files matching regex. ")
	parser.add_argument("-i", "--infile", default="")
	parser.add_argument("-o", "--outdir", default="har-out/")

	parser.add_argument("-f", "--overwrite", action="store_true", help="Overwrite HTML files if they already exist.")
	args = parser.parse_args()
	return args

def thousands(x):
	"Return number x as a string with thousands separated by space."
	return '{:,}'.format(x).replace(',', ' ')

def main():
	# initialize
	args=parseArgs()
	logformat="%(funcName)s():%(lineno)i: %(message)s %(levelname)s"
	logging.basicConfig(level=args.log_level, format=logformat)
	debug(args)
	debug(args.infile)

	if not args.infile:
		print("Please specify input HAR file: 'har-extract-text.py -i tero.har'.")
		sys.exit(1)

	if not os.path.exists(args.outdir):
		os.makedirs(args.outdir, exist_ok=True)
		print(f'Created output directory "{args.outdir}."')

	# slurp read input HAR json file
	d = {}
	with open(args.infile, "r") as f:
		d = json.loads(f.read())
	print(f'Loaded HAR file "{args.infile}" with {len(d["log"]["entries"])} entries. ')

	filesWritten=0
	for flow in d["log"]["entries"]: # flow: request+response, same word used by mitmproxy
		# extract fields
		url =  flow["request"]["url"]
		if not re.findall(args.match, url):
			print(f'Skipping "{url}". URL does not match --match regegx "{args.match}".')
			continue

		html = flow["response"]["content"]["text"]

		# create safe filename
		filename = url.split("/")[-1]
		filename = filename.replace(".html", "")
		filename = re.sub(r"\W", "_", filename)
		filename = f"{filename}.html"
		filename = os.path.join(args.outdir, filename) # prettier than f-string, avoids double slash

		# show page
		htmlStart = html[:78].replace('\n', '\\n')
		debug(f"{filename}: {url}: { htmlStart } (html len {len(html)} chars)")

		# write the file
		if os.path.exists(filename) and not args.overwrite:
			print(f'Warning: Skipping "{filename}". File already exists and no --overwrite selected.')
			continue
		with open(filename, "w") as f:
			f.write(html)
			filesWritten += 1
			print(f'Wrote "{filename}": {thousands(len(html))} chars. ')
	print(f'Wrote {filesWritten} HTML files to "{args.outdir}". Done.')

if __name__ == "__main__":
	main()
