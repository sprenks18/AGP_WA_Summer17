/**
 * 
 */
package edu.wlu.graffiti.data.export;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import edu.wlu.graffiti.bean.AGPInfo;
import edu.wlu.graffiti.bean.Inscription;

/**
 * This class serializes Inscription objects and returns a string in CSV format to represent
 * the objects.
 * 
 * @author Hammad Ahmad
 *
 */
public class GenerateCSV {
	
	private static final String NEW_LINE_SEPARATOR = "\n";
	
	// the fields
	private static final Object[] FILE_HEADER = {"edrId", "edrFindspot", "bibliography", 
			"content", "apparatus", "date", "agpId", "summary", "commentary", 
			"contentTranslation", "writingStyleInEnglish", "languageInEnglish", "graffitoHeight", 
			"graffitoLength", "minLetterHeight", "maxLetterHeight", "minLetterWithFlourishesHeight",
			"maxLetterWithFlourishesHeight", "cil", "langner", "propertyNumber", "propertyName",
			"pleiadesId", "italianPropertyName", "propertyCommentary", "insulaShortName", "insulaFullName",
			"cityName", "cityDescription"};
	
	/**
	 * Serializes a list of inscriptions to CSV.
	 * 
	 * @param inscriptions The list of inscription
	 * @return the string representation in CSV format
	 */
	public String serializeToCSV(List<Inscription> inscriptions) {
		
		StringBuilder stringBuilder = new StringBuilder();
		CSVPrinter csvFilePrinter = null;
		
		CSVFormat csvFileFormat = CSVFormat.DEFAULT.withRecordSeparator(NEW_LINE_SEPARATOR);
		
		try {
			csvFilePrinter = new CSVPrinter(stringBuilder, csvFileFormat);
			csvFilePrinter.printRecord(FILE_HEADER);
			for(Inscription i : inscriptions) {
				writeInscriptionToCSV(i, csvFilePrinter);
			}
			csvFilePrinter.close();
			
			return stringBuilder.toString();
			
		} catch (IOException e) {
			e.printStackTrace();
		} 
		
		return "";
	}
	
	/**
	 * Serializes an inscription to CSV.
	 * 
	 * @param i The inscription
	 * @return the string representation in CSV format
	 */
	public String serializeToCSV(Inscription i) {
		
		StringBuilder stringBuilder = new StringBuilder();
		CSVPrinter csvFilePrinter = null;
		
		CSVFormat csvFileFormat = CSVFormat.DEFAULT.withRecordSeparator(NEW_LINE_SEPARATOR);
		
		try {
			csvFilePrinter = new CSVPrinter(stringBuilder, csvFileFormat);
			csvFilePrinter.printRecord(FILE_HEADER);
			writeInscriptionToCSV(i, csvFilePrinter);
			csvFilePrinter.close();
			
			return stringBuilder.toString();
			
		} catch (IOException e) {
			e.printStackTrace();
		} 
		
		return "";	
	}

	/**
	 * Writes individual fields from an inscription to the CSV export.
	 * 
	 * @param i The inscription
	 * @param csvFilePrinter The file printer
	 * @throws IOException
	 */
	private void writeInscriptionToCSV(Inscription i, CSVPrinter csvFilePrinter) throws IOException {
		
		List<Object> inscriptionRecord = new ArrayList<Object>();
		
		// fill in the fields
		inscriptionRecord.add(i.getEdrId());
		inscriptionRecord.add(i.getEDRFindSpot());
		inscriptionRecord.add(i.getBibliography());
		inscriptionRecord.add(i.getContent());
		inscriptionRecord.add(i.getApparatus());
		inscriptionRecord.add(i.getDate());
		inscriptionRecord.add(i.getAgp().getAgpId());
		inscriptionRecord.add(i.getAgp().getSummary());
		inscriptionRecord.add(i.getAgp().getCommentary());
		inscriptionRecord.add(i.getAgp().getContentTranslation());
		inscriptionRecord.add(i.getAgp().getWritingStyleInEnglish());
		inscriptionRecord.add(i.getAgp().getLanguageInEnglish());
		inscriptionRecord.add(i.getAgp().getGraffitoHeight());
		inscriptionRecord.add(i.getAgp().getGraffitoLength());
		inscriptionRecord.add(i.getAgp().getMinLetterHeight());
		inscriptionRecord.add(i.getAgp().getMaxLetterHeight());
		inscriptionRecord.add(i.getAgp().getMinLetterWithFlourishesHeight());
		inscriptionRecord.add(i.getAgp().getMaxLetterWithFlourishesHeight());
		inscriptionRecord.add(i.getAgp().getCil());
		inscriptionRecord.add(i.getAgp().getLangner());
		inscriptionRecord.add(i.getAgp().getProperty().getPropertyNumber());
		inscriptionRecord.add(i.getAgp().getProperty().getPropertyName());
		inscriptionRecord.add(i.getAgp().getProperty().getPleiadesId());
		inscriptionRecord.add(i.getAgp().getProperty().getItalianPropertyName());
		inscriptionRecord.add(i.getAgp().getProperty().getCommentary());
		inscriptionRecord.add(i.getAgp().getProperty().getInsula().getShortName());
		inscriptionRecord.add(i.getAgp().getProperty().getInsula().getFullName());
		inscriptionRecord.add(i.getAgp().getProperty().getInsula().getCity().getName());
		inscriptionRecord.add(i.getAgp().getProperty().getInsula().getCity().getDescription());
		
		/**
		inscriptionRecord.add(Integer.toString(i.getId()));
		inscriptionRecord.add(i.getAncientCity());
		inscriptionRecord.add(i.getFindSpot());
		inscriptionRecord.add(Integer.toString(i.getFindSpotPropertyID()));
		inscriptionRecord.add(i.getMeasurements());
		inscriptionRecord.add(i.getLanguage());
		inscriptionRecord.add(i.getWritingStyle());
		inscriptionRecord.add(i.getApparatusDisplay());
		inscriptionRecord.add(Integer.toString(i.getNumberOfImages()));
		inscriptionRecord.add("startImageId");
		inscriptionRecord.add("stopImageId");
		inscriptionRecord.add("agp");
		*/
		
		// write the inscription record
		csvFilePrinter.printRecord(inscriptionRecord);
	}
	
	public GenerateCSV() {
		
	}

}

