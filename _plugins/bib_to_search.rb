# _plugins/bib_to_search.rb
# Reads _bibliography/papers.bib and populates site.data['pub_search']
# so the Cmd+K search index auto-updates whenever you edit papers.bib.

module Jekyll
  class BibToSearch < Generator
    safe true
    priority :low

    def generate(site)
      bib_file = File.join(site.source, '_bibliography', 'papers.bib')
      return unless File.exist?(bib_file)

      begin
        require 'bibtex'

        # Strip Jekyll front matter before parsing
        content = File.read(bib_file).sub(/\A---.*?---\n/m, '')
        bib = BibTeX.parse(content)

        publications = []
        bib.each do |entry|
          # Skip @string, @comment, etc. — only process real entries
          next unless entry.is_a?(BibTeX::Entry)

          title = entry[:title].to_s.gsub(/[{}]/, '').gsub(/\s+/, ' ').strip
          next if title.empty?

          doi     = entry[:doi].to_s.strip
          arxiv   = entry[:arxiv].to_s.strip
          website = entry[:website].to_s.strip
          raw_url = entry[:url].to_s.strip

          url = if !doi.empty?
            doi.start_with?('http') ? doi : "https://doi.org/#{doi}"
          elsif !arxiv.empty?
            "https://arxiv.org/abs/#{arxiv}"
          elsif !website.empty?
            website
          elsif !raw_url.empty?
            raw_url
          else
            '/publications/'
          end

          publications << {
            'title' => title,
            'url'   => url,
            'year'  => entry[:year].to_s
          }
        end

        site.data['pub_search'] = publications
        Jekyll.logger.info "BibSearch:", "Indexed #{publications.size} publication(s) for Cmd+K search."
      rescue => e
        Jekyll.logger.warn "BibSearch:", "Error: #{e.message}"
        site.data['pub_search'] ||= []
      end
    end
  end
end
